import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasurementUnitVmFormComponent } from './measurement-unit-vm-form.component';

describe('MeasurementUnitVmFormComponent', () => {
  let component: MeasurementUnitVmFormComponent;
  let fixture: ComponentFixture<MeasurementUnitVmFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeasurementUnitVmFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MeasurementUnitVmFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
