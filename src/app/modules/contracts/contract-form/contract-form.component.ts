import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ContractFormStepper,
  ContractStepper,
} from '../shared/contract-form-stepper.interface';
import { FormGroup } from '@angular/forms';
import { ContractMainDataVm, HttpResultOfString, SavingType } from '@core/api';
import { STEPPER_ROUTES } from '../shared/contract-stepper-routes';
import { ContractFormService } from '../shared/contract-form.service';
import { environment } from '@env/environment';
import { concatMap, first, map, of, take, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-contract-form',
  templateUrl: './contract-form.component.html',
  styleUrl: './contract-form.component.scss',
})
export class ContractFormComponent implements OnInit, OnDestroy {
  translate = inject(TranslateService);
  readonly router = inject(Router);
  private readonly _contractFormService = inject(ContractFormService);
  private readonly route = inject(ActivatedRoute);
  private readonly ref = inject(ChangeDetectorRef);
  private readonly _toastr = inject(ToastrService);

  currentStepper: ContractFormStepper;
  currentForm: FormGroup;
  stepperIdx = signal(0);
  stepEnabled = this._contractFormService.stepEnabled;

  currentContractId = this._contractFormService.currentContractId;
  currentStepId = this._contractFormService.currentStepId;

  loading = this._contractFormService.loadingSig;

  lastStep = this._contractFormService.lastStep;

  contractStepper: Signal<ContractStepper[]> = computed(() => {
    return [
      {
        title: this.translate.instant('contract.stepper.main.title'),
        subtitle: this.translate.instant('contract.stepper.main.subtitle'),
        route: STEPPER_ROUTES.MAIN,
        disabled: false,
      },
      {
        title: this.translate.instant('contract.stepper.award.title'),
        subtitle: this.translate.instant('contract.stepper.award.subtitle'),
        route: STEPPER_ROUTES.AWARD,
        disabled: this.lastStep() < 2 && this.stepEnabled() < 2,
      },
      {
        title: this.translate.instant('contract.stepper.delegation.title'),
        subtitle: this.translate.instant('contract.stepper.delegation.subtitle'),
        route: STEPPER_ROUTES.DELEGATION,
        disabled: this.lastStep() < 3 && this.stepEnabled() < 3,
      },
      {
        title: this.translate.instant('contract.stepper.guarantee.title'),
        subtitle: this.translate.instant('contract.stepper.guarantee.subtitle'),
        route: STEPPER_ROUTES.GUARANTEE,
        disabled: this.lastStep() < 4 && this.stepEnabled() < 4,
      },
      {
        title: this.translate.instant('contract.stepper.details.title'),
        subtitle: this.translate.instant('contract.stepper.details.subtitle'),
        route: STEPPER_ROUTES.DETAILS,
        disabled: this.lastStep() < 5 && this.stepEnabled() < 5,
      },
      {
        title: this.translate.instant('contract.stepper.operations.title'),
        subtitle: this.translate.instant('contract.stepper.operations.subtitle'),
        route: STEPPER_ROUTES.OPERATIONS,
        disabled: this.lastStep() < 6 && this.stepEnabled() < 6,
      },
      {
        title: this.translate.instant('contract.stepper.terms.title'),
        subtitle: this.translate.instant('contract.stepper.terms.subtitle'),
        route: STEPPER_ROUTES.QUANTITIES,
        disabled: this.lastStep() < 7 && this.stepEnabled() < 7,
      },
      {
        title: this.translate.instant('contract.stepper.fines.title'),
        subtitle: this.translate.instant('contract.stepper.fines.subtitle'),
        route: STEPPER_ROUTES.FINES,
        disabled: this.lastStep() < 8 && this.stepEnabled() < 8,
      },
    ];
  });

  ngOnInit(): void {
    const { contractId } = this.route.snapshot.params;
    if (contractId) {
      this.currentContractId.set(contractId);
    }
  }

  onContractFormRouteChange(component: ContractFormStepper) {
    this.currentStepper = component;
    this.currentForm = component.contractForm;
    const routes = this.router.url.split('/') as string[];
    const routeOutlet = routes[routes.length - 1];

    this.stepperIdx.set(
      this.contractStepper().findIndex((s) => routeOutlet.includes(s.route))
    );

    component.title = this.contractStepper()[this.stepperIdx()].title;

    if (this.currentContractId() !== undefined) {
      this.currentStepper
        .getData(this.currentContractId(), environment.apiVersion)
        .pipe(
          first(),
          tap((data) => {
            if (data.stepNumber) {
              this.stepEnabled.set(data.stepNumber);
            }
            if (data.lastStep) {
              this.lastStep.set(data.lastStep);
              this.stepEnabled.set(data.lastStep + 1);
            }
            if (data.id) {
              this.currentStepId.set(data.id);
            } else {
              this.currentStepId.set(null);
            }
            if (!this.currentForm) return;
            this.currentForm.patchValue(data);
            this.currentForm.updateValueAndValidity();
            this.currentForm.markAsUntouched();
            this.ref.detectChanges();
          }),
          concatMap((obs) => {
            // if I do not know what lastStep is
            // this usually occurs when I init the page, request any stepper (except the first) and the response of lastStep is null
            if (!this.lastStep() && this.stepperIdx() > 0) {
              return this._contractFormService
                .getContractDetails(this.currentContractId())
                .pipe(
                  take(1),
                  tap((contractMainData: ContractMainDataVm) => {
                    if (contractMainData.lastStep) {
                      this.lastStep.set(contractMainData.lastStep);
                      this.stepEnabled.set(contractMainData.lastStep + 1);
                    }
                  })
                );
            }
            return of(obs);
          })
        )
        .subscribe();
    }
  }

  routeToStepper(route: string, disabled: boolean, index: number) {
    if (disabled) return;
    this.stepperIdx.set(index);
    this.router.navigate([
      `/contracts/edit/${this.currentContractId()}`,
      {
        outlets: {
          contractStepper: [route],
        },
      },
    ]);
  }

  previousStep() {
    this.stepperIdx.set(this.stepperIdx() - 1);
    this.router.navigate([
      `/contracts/edit/${this.currentContractId()}`,
      {
        outlets: {
          contractStepper: [this.contractStepper()[this.stepperIdx()].route],
        },
      },
    ]);
  }

  nextStep() {
    this.stepperIdx.set(this.stepperIdx() + 1);
    this.router.navigate([
      `/contracts/edit/${this.currentContractId()}`,
      {
        outlets: {
          contractStepper: [this.contractStepper()[this.stepperIdx()].route],
        },
      },
    ]);
  }

  private goToNextAndModifyLastStep(): void {
    this.nextStep();
    this.lastStep.set(this.stepperIdx() + 1);
  }

  submitForm(lastStep: boolean = false) {
    if (lastStep) {
      this._toastr.success(this.translate.instant('contract.contractSaved'), '', {
        positionClass: 'toast-bottom-center',
      });
      this.router.navigateByUrl('/contracts');
      return;
    }
    if (this.stepperIdx() === 5) {
      if (this.lastStep() === 5) return;
      this.nextStep();
      return;
    }

    if (this.stepperIdx() === 6) {
      this.nextStep();
      return;
    }

    if (
      this.currentContractId() &&
      !this.currentForm.touched &&
      this.stepperIdx() < this.stepEnabled() - 1 &&
      this.stepperIdx() < this.contractStepper().length - 1
    ) {
      this.nextStep();
      return;
    }

    this._contractFormService.setLoading(true);
    if (!this.currentStepId()) {
      this.currentStepper
        .postData(SavingType.Save)
        .subscribe((res: HttpResultOfString) => {
          if (this.stepperIdx() === 0) {
            this.currentContractId.set(res.result); // contractID
          } else {
            this.currentStepId.set(res.result); // stepId
          }

          this.goToNextAndModifyLastStep();
        });
    } else {
      this.currentStepper
        .putData(SavingType.Save)
        .subscribe((res: HttpResultOfString) => {
          this.goToNextAndModifyLastStep();
        });
    }
  }

  submitFormAsDraft() {
    this._contractFormService.setLoading(true);
    if (!this.currentStepId()) {
      this.currentStepper
        .postData(SavingType.Draft)
        .subscribe((res: HttpResultOfString) => {
          if (this.stepperIdx() === 0) {
            this.currentContractId.set(res.result); // contractId
          } else {
            this.currentStepId.set(res.result); // stepId
          }
        });
    } else {
      this.currentStepper
        .putData(SavingType.Draft)
        .subscribe((res: HttpResultOfString) => {});
    }
  }

  ngOnDestroy(): void {
    this._contractFormService.currentContractId.set(undefined);
    this._contractFormService.currentStepId.set(undefined);
    this._contractFormService.lastStep.set(0);
    this._contractFormService.stepEnabled.set(1);
  }
}
