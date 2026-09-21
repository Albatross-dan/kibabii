import NewListing from './NewListing';
import Listings from './Listings';
import EditListing from './EditListing';
import Analytics from './Analytics';
import BillingPlans from './BillingPlans';
import { PlaceholderPage } from '../Placeholders';

export { Listings };
export { NewListing };
export { EditListing };
export { Analytics };
export { BillingPlans as DashboardSettings };

export function SellerOrders() { return <PlaceholderPage name="Seller Orders" />; }
export function SellerReviews() { return <PlaceholderPage name="Store Reviews" />; }
