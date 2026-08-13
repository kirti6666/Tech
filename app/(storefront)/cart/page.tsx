import { redirect } from "next/navigation";

/**
 * The cart and the checkout were one page short of identical: same lines,
 * same add-ons, same totals, with the cart's only extra job being a button
 * that goes to the checkout. For a catalogue where an order is almost
 * always one product, that's a step that exists to be clicked through.
 *
 * So /cart redirects. Kept as a route because the header cart icon, old
 * links and bookmarks all point at it.
 */
export default function CartPage() {
  redirect("/checkout");
}
