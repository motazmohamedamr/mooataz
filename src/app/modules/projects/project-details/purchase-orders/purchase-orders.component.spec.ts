import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseOrdersComponent } from './purchase-orders.component';

describe('PurchaseOrdersComponent', () => {
  let component: PurchaseOrdersComponent;
  let fixture: ComponentFixture<PurchaseOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseOrdersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PurchaseOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
