import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedtestComponent } from './sharedtest.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { TableComponent } from 'src/app/core/shared/components/table/table.component';
import { TablesComponent } from 'src/app/modules/widgets-examples/tables/tables.component';
import { SharedModule } from 'src/app/core/shared/shared.module';
import { LogoutDialogComponent } from 'src/app/core/shared/components/logout-dialog/logout-dialog.component';



@NgModule({
  declarations: [SharedtestComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    InlineSVGModule,
    RouterModule.forChild([
      {
        path: '',
        component: SharedtestComponent,
      },
    ]),
    
  ],

  
})
export class SharedtestModule { }
