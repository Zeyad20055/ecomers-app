import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'manager/login',
    loadComponent: () => import('./features/manager-login/manager-login.component').then((m) => m.ManagerLoginComponent)
  },
  {
    path: 'manager',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/manager-layout/manager-layout.component').then((m) => m.ManagerLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        children: [
          { path: '', pathMatch: 'full', loadComponent: () => import('./features/manager-dashboard/dashboard-home/dashboard-home.component').then((m) => m.DashboardHomeComponent) },
          { path: 'categories', loadComponent: () => import('./features/manager-dashboard/categories/categories.component').then((m) => m.CategoriesComponent) },
          { path: 'items', loadComponent: () => import('./features/manager-dashboard/items/items.component').then((m) => m.ItemsComponent) },
          { path: 'orders', loadComponent: () => import('./features/manager-dashboard/orders/orders.component').then((m) => m.OrdersComponent) },
          { path: 'notes', loadComponent: () => import('./features/manager-dashboard/notes/notes.component').then((m) => m.NotesComponent) }
        ]
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent) },
      { path: 'items/:id', loadComponent: () => import('./features/item-details/item-details.component').then((m) => m.ItemDetailsComponent) },
      { path: 'favorites', loadComponent: () => import('./features/favorites/favorites.component').then((m) => m.FavoritesComponent) },
      { path: 'cart', loadComponent: () => import('./features/cart/cart.component').then((m) => m.CartComponent) },
      { path: 'checkout', loadComponent: () => import('./features/checkout/checkout.component').then((m) => m.CheckoutComponent) },
      { path: 'order-success', loadComponent: () => import('./features/order-success/order-success.component').then((m) => m.OrderSuccessComponent) },
      { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent) }
    ]
  }
];
