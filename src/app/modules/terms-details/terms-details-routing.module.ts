import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { TermsDetailsComponent } from './terms-details.component';
import { PriceRequestsComponent } from './price-requests/price-requests.component';
import { SupplyRequestsComponent } from './supply-requests/supply-requests.component';
import { TermsExtractsComponent } from './terms-extracts/terms-extracts.component';
import { ConvenantRequestsComponent } from './convenant-requests/convenant-requests.component';
import { ExtractsDetailsViewComponent } from './terms-extracts/extracts-details-view/extracts-details-view.component';

const routes: Route[] = [
  {
    path: '',
    component: TermsDetailsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'price-requests',
      },
      {
        path: 'price-requests',
        component: PriceRequestsComponent,
      },
      {
        path: 'supply-requests',
        component: SupplyRequestsComponent,
      },
      {
        path: 'convenant-requests',
        component: ConvenantRequestsComponent,
      },
      {
        path: 'extracts',
        component: TermsExtractsComponent,
        pathMatch: 'full',
      },
      {
        path: 'extracts/:requestId',
        component: ExtractsDetailsViewComponent,
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TermsDetailsRoutingModule {}
