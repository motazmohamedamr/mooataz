import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Subscription } from 'rxjs';
import {
  AccountDetailsVm,
  ChangeProfileCommand,
  FileParameter,
  FullNameDto,
  ProfileClient,
} from '@core/api';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiHandlerService } from '@core/services/api-handler.service';
import { TranslateService } from '@ngx-translate/core';
import { IdentityManager } from '@core/auth';
import { environment } from '@env/environment';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile-details',
  templateUrl: './profile-details.component.html',
})
export class ProfileDetailsComponent implements OnInit, OnDestroy {
  @Input() userDetails: AccountDetailsVm;

  form: FormGroup;
  newPictureUri: string;

  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoading: boolean;
  private unsubscribe: Subscription[] = [];

  swalTranslation: any;
  translation: any;

  constructor(
    private _profileClient: ProfileClient,
    private _identityManager: IdentityManager,
    private _handler: ApiHandlerService,
    private _translateService: TranslateService,
    private _cdr: ChangeDetectorRef
  ) {
    const loadingSubscr = this.isLoading$
      .asObservable()
      .subscribe((res) => (this.isLoading = res));
    this.unsubscribe.push(loadingSubscr);
  }

  get firstName(): FormControl {
    return this.form.get('fullName.firstName') as FormControl;
  }

  get lastName(): FormControl {
    return this.form.get('fullName.lastName') as FormControl;
  }

  get phoneNumber(): FormControl {
    return this.form.get('phoneNumber') as FormControl;
  }

  async ngOnInit(): Promise<void> {
    this.swalTranslation = await firstValueFrom(
      this._translateService.get('general.sweetAlert')
    );
    this.translation = await firstValueFrom(this._translateService.get('profile'));

    this.form = new FormGroup({
      fullName: new FormGroup({
        firstName: new FormControl(this.userDetails.name.firstName, [
          Validators.required,
        ]),
        lastName: new FormControl(this.userDetails.name.lastName, [Validators.required]),
      }),
      picture: new FormControl(''),
      phoneNumber: new FormControl(this.userDetails.phoneNumber),
    });

    this.newPictureUri = this.userDetails.pictureUrl;
  }

  changePicture(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = (e) => {
      this.newPictureUri = URL.createObjectURL(file);

      this._cdr.detectChanges();

      this.form.patchValue({
        picture: file,
      });
    };

    this.form.markAsDirty();
  }

  saveSettings() {
    this.isLoading$.next(true);

    const formValue = this.form.value;

    const command = new ChangeProfileCommand({
      fullName: new FullNameDto({
        firstName: formValue.fullName.firstName,
        lastName: formValue.fullName.lastName,
      }),
      phoneNumber: formValue.phoneNumber,
    });

    this._profileClient
      .changeProfile(environment.apiVersion, command)
      .pipe(
        finalize(() => {
          this.isLoading$.next(false);
          this._cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          const picture = this.form.get('picture')?.value;

          if (picture) {
            this.isLoading$.next(true);

            const fileParameter = {
              data: picture,
              fileName: picture.name,
            } as FileParameter;

            this._profileClient
              .changePicture(environment.apiVersion, fileParameter)
              .pipe(finalize(() => this.isLoading$.next(false)))
              .subscribe({
                next: () => this.updatedSuccessfully(),
                error: (err) => this._handler.handleError(err).pushError(),
              });
          } else {
            this.updatedSuccessfully();
          }
        },
        error: (err) =>
          this._handler.handleError(err).assignValidationErrors(this.form).pushError(),
      });
  }

  updatedSuccessfully(): void {
    this._identityManager.initAccount().subscribe();

    const translation = this.swalTranslation.success;

    Swal.fire({
      title: translation.title,
      text: translation.text,
      icon: 'success',
      confirmButtonText: translation.confirmButtonText,
      customClass: {
        confirmButton: 'btn btn-primary',
      },
    }).then();
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
