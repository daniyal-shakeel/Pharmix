const Manufacturer = require('../models/Manufacturer');
const Pharmacy = require('../models/Pharmacy');
const DeliveryPartner = require('../models/DeliveryPartner');
const LinkHistory = require('../models/LinkHistory');
const { generateId } = require('../utils/cryptoId');

const ENTITY_MAP = {
  manufacturer: { model: Manufacturer, prefix: 'MFR' },
  pharmacy: { model: Pharmacy, prefix: 'PHR' },
  delivery: { model: DeliveryPartner, prefix: 'DLV' }
};

const detectEntityType = (entityId) => {
  if (entityId.startsWith('MFR')) return 'manufacturer';
  if (entityId.startsWith('PHR')) return 'pharmacy';
  if (entityId.startsWith('DLV')) return 'delivery';
  return null;
};

const getEntityModel = (type) => {
  return ENTITY_MAP[type]?.model || null;
};

const linkEntities = async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;
    const adminId = req.user.id || req.user.entityId;

    if (!sourceId || !targetId) {
      return res.status(400).json({ error: 'Both sourceId and targetId are required' });
    }

    if (sourceId === targetId) {
      return res.status(400).json({ error: 'Cannot link an entity to itself' });
    }

    const sourceType = detectEntityType(sourceId);
    const targetType = detectEntityType(targetId);

    if (!sourceType || !targetType) {
      return res.status(400).json({ error: 'Invalid entity ID format' });
    }

    const invalidPair = (sourceType === 'pharmacy' && targetType === 'delivery') ||
                        (sourceType === 'delivery' && targetType === 'pharmacy');
    if (invalidPair) {
      return res.status(400).json({ error: 'Pharmacy and Delivery Partner cannot be linked directly. Riders must be linked to Manufacturers.' });
    }

    const SourceModel = getEntityModel(sourceType);
    const TargetModel = getEntityModel(targetType);

    const source = await SourceModel.findOne({ id: sourceId });
    const target = await TargetModel.findOne({ id: targetId });

    if (!source) return res.status(404).json({ error: `Source entity not found: ${sourceId}` });
    if (!target) return res.status(404).json({ error: `Target entity not found: ${targetId}` });

    const existingLink = await LinkHistory.findOne({
      sourceId, targetId, status: 'active'
    });
    if (existingLink) {
      return res.status(400).json({ error: 'This relationship already exists and is active' });
    }

    if (sourceType === 'pharmacy' && targetType === 'manufacturer') {
      if (!source.linkedManufacturers.includes(targetId)) {
        source.linkedManufacturers.push(targetId);
        await source.save();
      }
    } else if (sourceType === 'manufacturer' && targetType === 'delivery') {
      if (!source.linkedDeliveryPartners.includes(targetId)) {
        source.linkedDeliveryPartners.push(targetId);
        await source.save();
      }
      if (!target.linkedManufacturers.includes(sourceId)) {
        target.linkedManufacturers.push(sourceId);
        await target.save();
      }
    } else if (sourceType === 'manufacturer' && targetType === 'pharmacy') {
      if (!target.linkedManufacturers.includes(sourceId)) {
        target.linkedManufacturers.push(sourceId);
        await target.save();
      }
    } else if (sourceType === 'delivery' && targetType === 'manufacturer') {
      if (!source.linkedManufacturers.includes(targetId)) {
        source.linkedManufacturers.push(targetId);
        await source.save();
      }
      if (!target.linkedDeliveryPartners.includes(sourceId)) {
        target.linkedDeliveryPartners.push(sourceId);
        await target.save();
      }
    } else {
      return res.status(400).json({ error: `Unsupported relationship: ${sourceType} → ${targetType}` });
    }

    const link = await LinkHistory.create({
      id: generateId('LNK'),
      sourceId,
      sourceType,
      targetId,
      targetType,
      status: 'active',
      linkedBy: adminId
    });

    res.status(201).json({ message: 'Entities linked successfully', link });
  } catch (error) {
    console.error('Link error:', error);
    res.status(500).json({ error: 'Failed to link entities' });
  }
};

const unlinkEntities = async (req, res) => {
  try {
    const { linkId } = req.params;

    const link = await LinkHistory.findOne({ id: linkId, status: 'active' });
    if (!link) {
      return res.status(404).json({ error: 'Active link not found' });
    }

    const { sourceId, sourceType, targetId, targetType } = link;
    const SourceModel = getEntityModel(sourceType);
    const TargetModel = getEntityModel(targetType);

    if (sourceType === 'pharmacy' && targetType === 'manufacturer') {
      await SourceModel.findOneAndUpdate(
        { id: sourceId },
        { $pull: { linkedManufacturers: targetId } }
      );
    } else if (sourceType === 'manufacturer' && targetType === 'delivery') {
      await SourceModel.findOneAndUpdate(
        { id: sourceId },
        { $pull: { linkedDeliveryPartners: targetId } }
      );
      await TargetModel.findOneAndUpdate(
        { id: targetId },
        { $pull: { linkedManufacturers: sourceId } }
      );
    } else if (sourceType === 'manufacturer' && targetType === 'pharmacy') {
      await TargetModel.findOneAndUpdate(
        { id: targetId },
        { $pull: { linkedManufacturers: sourceId } }
      );
    } else if (sourceType === 'delivery' && targetType === 'manufacturer') {
      await SourceModel.findOneAndUpdate(
        { id: sourceId },
        { $pull: { linkedManufacturers: targetId } }
      );
      await TargetModel.findOneAndUpdate(
        { id: targetId },
        { $pull: { linkedDeliveryPartners: sourceId } }
      );
    }

    link.status = 'unlinked';
    link.unlinkedAt = new Date();
    await link.save();

    res.json({ message: 'Entities unlinked successfully', link });
  } catch (error) {
    console.error('Unlink error:', error);
    res.status(500).json({ error: 'Failed to unlink entities' });
  }
};

const relinkEntities = async (req, res) => {
  try {
    const { linkId } = req.body;
    if (!linkId) return res.status(400).json({ error: 'Link ID is required' });

    const link = await LinkHistory.findOne({ id: linkId, status: 'unlinked' });
    if (!link) {
      return res.status(404).json({ error: 'Unlinked relationship not found' });
    }

    const { sourceId, sourceType, targetId, targetType } = link;
    const SourceModel = getEntityModel(sourceType);
    const TargetModel = getEntityModel(targetType);

    const source = await SourceModel.findOne({ id: sourceId });
    const target = await TargetModel.findOne({ id: targetId });

    if (!source || !target) {
      return res.status(404).json({ error: 'One or both entities no longer exist' });
    }

    if (sourceType === 'pharmacy' && targetType === 'manufacturer') {
      if (!source.linkedManufacturers.includes(targetId)) {
        source.linkedManufacturers.push(targetId);
        await source.save();
      }
    } else if (sourceType === 'manufacturer' && targetType === 'delivery') {
      if (!source.linkedDeliveryPartners.includes(targetId)) {
        source.linkedDeliveryPartners.push(targetId);
        await source.save();
      }
      if (!target.linkedManufacturers.includes(sourceId)) {
        target.linkedManufacturers.push(sourceId);
        await target.save();
      }
    } else if (sourceType === 'manufacturer' && targetType === 'pharmacy') {
      if (!target.linkedManufacturers.includes(sourceId)) {
        target.linkedManufacturers.push(sourceId);
        await target.save();
      }
    } else if (sourceType === 'delivery' && targetType === 'manufacturer') {
      if (!source.linkedManufacturers.includes(targetId)) {
        source.linkedManufacturers.push(targetId);
        await source.save();
      }
      if (!target.linkedDeliveryPartners.includes(sourceId)) {
        target.linkedDeliveryPartners.push(sourceId);
        await target.save();
      }
    }

    link.status = 'active';
    link.linkedAt = new Date();
    link.unlinkedAt = undefined;
    await link.save();

    res.json({ message: 'Entities relinked successfully', link });
  } catch (error) {
    console.error('Relink error:', error);
    res.status(500).json({ error: 'Failed to relink entities' });
  }
};

const getLinkHistory = async (req, res) => {
  try {
    const links = await LinkHistory.find({}).sort({ linkedAt: -1 }).lean();

    const enriched = [];
    for (const link of links) {
      const SourceModel = getEntityModel(link.sourceType);
      const TargetModel = getEntityModel(link.targetType);
      const source = await SourceModel.findOne({ id: link.sourceId }).select('name').lean();
      const target = await TargetModel.findOne({ id: link.targetId }).select('name').lean();
      enriched.push({
        ...link,
        sourceName: source?.name || link.sourceId,
        targetName: target?.name || link.targetId
      });
    }

    res.json(enriched);
  } catch (error) {
    console.error('Link history error:', error);
    res.status(500).json({ error: 'Failed to fetch link history' });
  }
};

module.exports = { linkEntities, unlinkEntities, getLinkHistory, relinkEntities };
