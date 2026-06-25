import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/store";
import { PageHeader, SectionPanel } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import api from "@/api/base";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_mock");

type CheckoutSearch = { cartId?: string };
export const Route = createFileRoute("/app/checkout")({
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => {
    return { cartId: search.cartId as string | undefined };
  },
  component: CheckoutWrapper,
});

function CheckoutWrapper() {
  return (
    <Elements stripe={stripePromise}>
      <Checkout />
    </Elements>
  );
}

function Checkout() {
  const stripe = useStripe();
  const elements = useElements();
  const search = Route.useSearch();
  const { carts, clear } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const cart = carts.find((c) => c._id === search.cartId) || carts[0];
  
  const items = cart?.items || [];
  const subtotal = items.reduce((a, b) => a + b.price * b.qty, 0);
  const tax = cart?.tax || 0;
  const shipping = cart?.shippingFee || 0;
  const total = subtotal + tax + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !cart) return;

    try {
      setLoading(true);

      // 1. Create Payment Intent on backend
      const { data } = await api.post("/orders/payment-intent", { cartId: cart._id });
      const { clientSecret } = data;

      // 2. Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "Test User",
          },
        },
      });

      if (result.error) {
        toast.error(result.error.message || "Payment failed");
        setLoading(false);
        return;
      }

      if (result.paymentIntent.status === "succeeded") {
        // 3. Confirm order on backend
        await api.post("/orders/confirm", { 
          cartId: cart._id, 
          stripePaymentIntentId: result.paymentIntent.id 
        });

        setDone(true);
        clear(cart.manufacturerId);
        toast.success("Payment successful");
        setTimeout(() => navigate({ to: "/app/orders" }), 2000);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "An error occurred during checkout");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="p-6 max-w-md mx-auto mt-20 text-center">
        <div className="h-14 w-14 rounded-full bg-success/15 border border-success/30 grid place-items-center mx-auto mb-4">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tightest">Payment successful</h1>
        <p className="text-sm text-muted-foreground mt-2">Redirecting to your orders...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      <PageHeader title="Checkout" description="Secure payment powered by Stripe" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-3">
          <SectionPanel title="Shipping address">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 text-foreground">
                <Label className="text-xs">Full name</Label>
                <Input defaultValue="Pharmacy Store A" className="h-9 bg-surface-2 border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input defaultValue="+92 300 1234567" className="h-9 bg-surface-2 border-border" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Address</Label>
                <Input
                  defaultValue="Street 1, Medical Complex"
                  className="h-9 bg-surface-2 border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">City</Label>
                <Input defaultValue="Karachi" className="h-9 bg-surface-2 border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Postal code</Label>
                <Input defaultValue="75500" className="h-9 bg-surface-2 border-border" />
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="Payment" description="Enter your card details">
            <div className="flex items-center gap-2 mb-4 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" /> 256-bit TLS · PCI DSS · Secure Payment
            </div>
            <div className="p-3 rounded-md border border-border bg-surface-2">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "14px",
                      color: "#ffffff",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                    invalid: {
                      color: "#ef4444",
                    },
                  },
                }}
              />
            </div>
          </SectionPanel>

          <Button
            type="submit"
            disabled={loading || items.length === 0 || !stripe}
            className="w-full h-10 bg-primary hover:bg-primary/90 text-sm"
          >
            {loading ? "Processing..." : `Pay Rs ${total.toFixed(2)}`}
          </Button>
        </form>

        <SectionPanel title="Summary">
          <div className="space-y-2 text-xs">
            {items.map((it) => (
              <div key={it.medicineId} className="flex justify-between">
                <span className="text-muted-foreground truncate pr-2">
                  {it.name} × {it.qty}
                </span>
                <span className="tabular-nums">Rs {(it.price * it.qty).toFixed(2)}</span>
              </div>
            ))}
            {items.length === 0 && <div className="text-muted-foreground">No items</div>}
            <div className="border-t border-border my-2" />
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">Rs {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="tabular-nums">Rs {shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span className="tabular-nums">Rs {tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">Rs {total.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-success" /> Trusted B2B Transaction
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
