import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractFormInputComponent } from './contract-form-input.component';

describe('ContractFormInputComponent', () => {
  let component: ContractFormInputComponent;
  let fixture: ComponentFixture<ContractFormInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContractFormInputComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContractFormInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
