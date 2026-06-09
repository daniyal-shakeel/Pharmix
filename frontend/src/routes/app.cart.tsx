import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/store";
import { PageHeader, SectionPanel } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ShoppingBag, Building2 } from "lucide-react";

export const Route = createFileRoute("/app/cart")({ component: Cart });

function Cart() {
  const carts = useCart((s) => s.carts);
  const remove = useCart((s) => s.remove);
  const setQty = useCart((s) => s.setQty);
  const clear = useCart((s) => s.clear);
  const busyItems = useCart((s) => s.busyItems);
  const totalItems = carts.reduce((acc, cart) => acc + cart.items.reduce((a, b) => a + b.qty, 0), 0);

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <PageHeader title="Cart" description={`${totalItems} items in your cart`} />
      {carts.length === 0 ? (
        <div className="surface rounded-xl p-16 text-center">
          <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Your cart is empty</p>
          <Link to="/app/medicines">
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Browse catalog
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {carts.map((cart) => {
            const subtotal = cart.items.reduce((a, b) => a + b.price * b.qty, 0);
            const tax = cart.tax || 0; // Tax always 0 per requirements
            const shipping = cart.shippingFee || 0;
            const total = subtotal + tax + shipping;

            return (
              <div key={cart._id} className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <SectionPanel
                  className="lg:col-span-2"
                  title={
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Manufacturer ID: {cart.manufacturerId}
                    </div>
                  }
                >
                  <div className="space-y-2">
                    {cart.items.map((it) => (
                      <div
                        key={it.medicineId}
                        className="flex items-center gap-3 p-3 rounded-md border border-border bg-surface-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{it.name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{it.medicineId}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={busyItems.includes(it.medicineId)}
                            onClick={() => setQty(it.medicineId, Math.max(1, it.qty - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-xs tabular-nums">{it.qty}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={busyItems.includes(it.medicineId)}
                            onClick={() => setQty(it.medicineId, it.qty + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                          {[100, 200, 300, 400, 600].map((q) => (
                            <Button
                              key={q}
                              variant="outline"
                              className={`h-5 px-1.5 text-[9px] border-border hover:bg-primary/10 hover:text-primary transition-colors ${it.qty === q ? "bg-primary/10 text-primary border-primary/30" : "bg-surface"}`}
                              disabled={busyItems.includes(it.medicineId)}
                              onClick={() => setQty(it.medicineId, q)}
                            >
                              {q}
                            </Button>
                          ))}
                        </div>
                        <div className="w-20 text-right text-sm tabular-nums shrink-0">
                          Rs {(it.price * it.qty).toFixed(2)}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive shrink-0"
                          disabled={busyItems.includes(it.medicineId)}
                          onClick={() => remove(it.medicineId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={() => clear(cart.manufacturerId)}
                    >
                      Clear manufacturer cart
                    </Button>
                  </div>
                </SectionPanel>

                <SectionPanel title="Order summary">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums">Rs {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (0%)</span>
                      <span className="tabular-nums">Rs {tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="tabular-nums">Rs {shipping.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-border my-2" />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total</span>
                      <span className="tabular-nums">Rs {total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Link to="/app/checkout" search={{ cartId: cart._id }}>
                    <Button className="w-full mt-4 bg-primary hover:bg-primary/90 h-9 text-xs">
                      Proceed to checkout
                    </Button>
                  </Link>
                </SectionPanel>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
