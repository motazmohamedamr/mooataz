import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { LayoutService } from 'src/app/_metronic/layout';
import { ConfirmationDialogComponent } from 'src/app/core/shared/components/confirmation-dialog/confirmation-dialog.component';
import { DeleteDialogComponent } from 'src/app/core/shared/components/delete-dialog/delete-dialog.component';
import { LogoutDialogComponent } from 'src/app/core/shared/components/logout-dialog/logout-dialog.component';

type Tabs = 'Table' | 'UploadFile' | 'accessDenial'| 'dialog' | 'keenicon' | 'multiSelect' | 'notFound' | 'imageUploader' |'uploader';

@Component({
  selector: 'sharedtest',
  templateUrl: './sharedtest.component.html',
  styleUrls: ['./sharedtest.component.scss']
})
export class SharedtestComponent {
  activeTab: Tabs = 'Table';
  model: any;
  selectedValues: string[] = []; // Ensure this is defined
  availableValues: string[] = ['Option 1', 'Option 2', 'Option 3']; // Ensure this is defined
  @ViewChild('form', { static: true }) form: NgForm;
  configLoading: boolean = false;
  resetLoading: boolean = false;

  constructor(
    private layout: LayoutService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.model = this.layout.getConfig();
  }

  setActiveTab(tab: Tabs) {
    this.activeTab = tab;
  }

  resetPreview(): void {
    this.resetLoading = true;
    this.layout.refreshConfigToDefault();
  }

  submitPreview(): void {
    this.configLoading = true;
    this.layout.setConfig(this.model);
    location.reload();
  }

  openConfirmationDialog(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: 'Are you sure you want to Confirm?' }
    });
  }

  openDeleteDialog(): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: { message: 'Are you sure you want to Delete?' }
    });
  }

  openLogoutDialog(): void {
    const dialogRef = this.dialog.open(LogoutDialogComponent, {
      data: { message: 'Are you sure you want to Log Out?' }
    });
  }
}
