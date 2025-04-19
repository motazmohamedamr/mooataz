import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { LogoutDialogComponent } from './logout-dialog.component';

describe('LogoutDialogComponent', () => {
  let component: LogoutDialogComponent;
  let fixture: ComponentFixture<LogoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogoutDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} } // provide a mock value or a proper implementation
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
