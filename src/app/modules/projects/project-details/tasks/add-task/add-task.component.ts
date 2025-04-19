import {
  Component,
  Input,
  OnInit,
  inject,
  ChangeDetectorRef,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AccountDetailsVm,
  AccountListVm,
  AttachmentSubType,
  AttachmentType,
  FileAttachmentDto,
  HttpResultOfString,
  IWorkItemCommentVm,
  ProjectQuantityAutoCompleteVm,
  ProjectsClient,
  StorageClient,
  StorageFile,
  UploadAttachmentDto,
  WorkItemDto,
  WorkItemPriority,
  WorkItemVm,
  WorkItemsClient,
} from '@core/api';
import { IdentityManager } from '@core/auth';
import { generateGUID } from '@core/shared/utils/generate-guid';
import { environment } from '@env/environment';
import { ProjectsService } from '@modules/projects/projects.service';
import { mimeTypeFromExtension } from '@modules/projects/utils/extension-to-mimetype';
import { NgbActiveModal, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { TagifySettings } from 'ngx-tagify';
import {
  BehaviorSubject,
  Observable,
  OperatorFunction,
  Subject,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  merge,
  mergeMap,
  of,
  switchMap,
} from 'rxjs';

interface TagData {
  value: string;
  [key: string]: any;
}
@Component({
  selector: 'app-add-task',
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTaskComponent implements OnInit {
  @Input() projectId: string;
  @Input() task: WorkItemVm;
  @Input() term: ProjectQuantityAutoCompleteVm;
  @Input() usersList: any[];
  userDetails$: Observable<AccountDetailsVm>;
  termName: string;
  termsList: ProjectQuantityAutoCompleteVm[] = [];
  tagsList: string[] = [];
  currentTags: string[] = [];
  attachmentsList: (FileAttachmentDto & { file: File; mimeType: string })[] = [];
  taskAttachments: any[] = [];
  commentsList: IWorkItemCommentVm[] = [];
  taskComments: IWorkItemCommentVm[] = [];
  user: any;
  account: any;
  date: any;
  test: string = 'ok';
  termFormatter = (term: any) => term.title;
  userFormatter = (user: any) => user.fullName;
  @ViewChild('instance', { static: true }) instance: NgbTypeahead;
  formGroup: FormGroup;

  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  WorkItemPriority = WorkItemPriority;

  activeModal = inject(NgbActiveModal);
  private readonly _projectClient = inject(ProjectsClient);
  private readonly _workItemsClient = inject(WorkItemsClient);
  private readonly _fb = inject(FormBuilder);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly _identityManager = inject(IdentityManager);
  private readonly _projectsService = inject(ProjectsService);

  get termObj(): FormControl {
    return this.formGroup?.get('termObj') as FormControl;
  }
  get taskName(): FormControl {
    return this.formGroup?.get('taskName') as FormControl;
  }
  get description(): FormControl {
    return this.formGroup?.get('description') as FormControl;
  }
  get priority(): FormControl {
    return this.formGroup?.get('priority') as FormControl;
  }
  get startingDate(): FormControl {
    return this.formGroup?.get('startingDate') as FormControl;
  }
  get periodDays(): FormControl {
    return this.formGroup?.get('periodDays') as FormControl;
  }
  get periodMonths(): FormControl {
    return this.formGroup?.get('periodMonths') as FormControl;
  }
  get periodYears(): FormControl {
    return this.formGroup?.get('periodYears') as FormControl;
  }
  get assignees(): FormControl {
    return this.formGroup?.get('assignees') as FormControl;
  }
  get tags(): FormControl {
    return this.formGroup?.get('tags') as FormControl;
  }
  get notes(): FormControl {
    return this.formGroup?.get('notes') as FormControl;
  }
  get attachments(): FormControl {
    return this.formGroup?.get('attachments') as FormControl;
  }

  settings: TagifySettings = {
    placeholder: 'Start typing...',
    blacklist: ['fucking', 'shit'],
    callbacks: {
      click: (e) => {
        console.log(e.detail);
      },
    },
  };

  whitelist$ = new BehaviorSubject<string[]>([]);

  readonly = false;

  disabled = false;

  ngOnInit() {
    this.getTags('ال');
    this.date = this.dateToObject(this.task?.startingDate);
    this.user = this.getUser(this.task?.assignees[0]);
    this.account = this._identityManager.getUser();
    let selectedTags: TagData[] = this.task?.tags?.map((a) => ({ value: a }));

    if (this.task) {
      this.taskAttachments = this.task.attachments;
      this.task.attachments.forEach((element) => {
        this.attachmentsList.push({
          ...element,
          file: null,
          mimeType: mimeTypeFromExtension(element.extension),
        } as FileAttachmentDto & { file: File; mimeType: string });
      });
      this._workItemsClient.getComments(this.task?.id, '1').subscribe((data) => {
        this.taskComments = data;
        this.taskComments.forEach((element) => {
          this.commentsList.push(element);
        });
      });
    }

    const comments = document.getElementById('comments');
    comments.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const x = new Date();
        const c: IWorkItemCommentVm = {
          content: this.notes.value,
          createdAt: new Date(),
        };
        this.commentsList.unshift(c);
        this.notes.setValue('');
        this.changeDetectorRef.detectChanges();
      }
    });

    this.formGroup = this._fb.group({
      termObj: [this.term ?? '', Validators.required],
      taskName: [this.task?.name ?? '', Validators.required],
      description: [this.task?.description ?? '', Validators.required],
      startingDate: [this.date ?? '', Validators.required],
      periodDays: [this.task?.period.days ?? ''],
      periodMonths: [this.task?.period.months ?? ''],
      periodYears: [this.task?.period.years ?? ''],
      assignees: [this.user ?? '', Validators.required],
      tags: [selectedTags ?? ''],
      priority: [this.task?.priority ?? '', Validators.required],
      notes: [''],
      attachments: [this.attachmentsList ?? ''],
    });
  }
  getAttachments() {
    if (this.task) {
      this.taskAttachments = this.task.attachments;
      this.taskAttachments.forEach((element) => {
        this.attachmentsList.push(element);
      });
      this.changeDetectorRef.detectChanges();
    }
  }

  dateToObject(date: Date) {
    return {
      year: date?.getFullYear(),
      month: date?.getMonth() + 1, // Months are zero-based
      day: date?.getDate(),
    };
  }

  termsSearch: OperatorFunction<string, readonly ProjectQuantityAutoCompleteVm[]> = (
    text$: Observable<string>
  ) => {
    const debouncedText$ = text$.pipe(debounceTime(500), distinctUntilChanged());

    return debouncedText$.pipe(
      switchMap((term) => {
        if (term.length < 1) return of([]);
        return this._projectClient
          .autoCompleteProjectQuantity(this.projectId, term, '1')
          .pipe(
            map((result) => {
              this.termsList = result;
              return this.termsList?.filter((t) => true);
            })
          );
      })
    );
  };

  usersSearch: OperatorFunction<string, readonly AccountListVm[]> = (
    text$: Observable<string>
  ) => {
    const debouncedText$ = text$.pipe(debounceTime(500), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(
      filter(() => !this.instance.isPopupOpen())
    );
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map((term) => {
        return term.length == 0
          ? this.usersList
          : this.usersList?.filter(
              (u) => u.fullName.toLowerCase().indexOf(term.toLowerCase()) > -1
            );
      })
    );
  };
  getTermsList(value: any) {
    this._projectClient
      .autoCompleteProjectQuantity(this.projectId, value, environment.apiVersion)
      .subscribe((result) => {
        this.termsList = result;
        this.changeDetectorRef.detectChanges();
      });
  }

  getUser(id: string) {
    console.log('📢[add-task.component.ts:268]: this.usersList: ', this.usersList);
    return this.usersList?.find((a) => a.id == id);
  }
  onAddTag(tagify: any) {
    this.currentTags = tagify.tags.map((a: { value: any }) => a.value);
  }

  getTagValue(value: string) {
    if (value.length >= 2) this.getTags(value);
  }
  getTags(value: string) {
    this._workItemsClient.getTags(value, '1').subscribe((data) => {
      this.whitelist$.next([...data]);
    });
  }
  getExtensions(type: string) {
    return type?.split('/')[1];
  }
  addAttachment(ele: any) {
    const files = (ele as HTMLInputElement).files;
    for (let index = 0; index < files.length; index++) {
      const file: File = files[index];
      const newID = generateGUID();
      const attachment = {
        displayName: file.name,
        uniqueKey: newID,
        uniqueName: newID,
        attachmentSubType: AttachmentSubType.None,
        extension: this.getExtensions(file.type),
        sizeInBytes: file.size,
        mimeType: file.type,
        file: file,
        init(_data) {},
        toJSON(data) {},
      } as FileAttachmentDto & { file: File; mimeType: string };
      this.attachmentsList.push(attachment);
    }
    const scrollableDiv = document.getElementById('modalBody');
    setTimeout(() => {
      scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
    }, 100);
  }

  removeFile(uniqueName: string, index: any) {
    this.attachmentsList.splice(index, 1);
  }
  deleteComment(comment: any, index: any) {
    this._workItemsClient.deleteComment(this.task.id, comment.id, '1').subscribe(() => {
      this.commentsList.splice(index, 1);
      this.changeDetectorRef.detectChanges();
    });
  }

  updateComment(comment: any) {
    const x = ((document.getElementById(comment.id) as HTMLButtonElement).disabled =
      false);
    document.getElementById(`update-${comment.id}`)?.classList.remove('d-none');
  }
  putUpdateComment(comment: any) {
    const commentInput = document.getElementById(comment.id) as HTMLButtonElement;
    const updateComment = document.getElementById(`update-${comment.id}`);
    const request: any = { content: commentInput.value };
    this._workItemsClient
      .updateComment(this.task.id, comment.id, '1', request)
      .subscribe(() => {
        commentInput.disabled = true;
        updateComment?.classList.add('d-none');
      });
  }

  postAttachments() {
    const files: StorageFile[] = this.attachmentsList.map(
      (att) =>
        ({
          uniqueKey: att.uniqueName,
          displayName: att.displayName,
          file: att.file as any,
        } as StorageFile)
    );
    return files.length > 0
      ? this._projectsService.upload(
          environment.apiVersion,
          files,
          AttachmentType.Other.toString()
        )
      : of(null);
  }

  submit() {
    const value = this.formGroup.value;
    if (value.periodDays == 0 && value.periodMonths == 0 && value.periodYears == 0)
      this.periodDays.setErrors({ required: true });

    const assignees: any[] = [];
    assignees.push(this.assignees.value.id);
    const startingDate: any = Object.values(this.startingDate.value).join('-');

    const taskObj = {
      termId: this.termObj?.value?.id || null,
      name: value.taskName,
      description: value.description,
      priority: +this.priority.value,
      startingDate: startingDate,
      period: {
        days: +this.periodDays.value,
        months: +this.periodMonths.value,
        years: +this.periodYears.value,
      },
      assignees: assignees,
      tags: this.currentTags,
      attachments: this.attachmentsList.map(
        (att) =>
          ({
            displayName: att.displayName,
            uniqueKey: att.uniqueKey,
            mimeType: att.mimeType,
            sizeInBytes: att.file?.size,
            attachmentSubType: att.attachmentSubType,
          } as UploadAttachmentDto)
      ),
    } as WorkItemDto;
    const commentsObs: Observable<HttpResultOfString>[] = [];

    if (!this.task) {
      this._workItemsClient
        .create(this.projectId, environment.apiVersion, taskObj)
        .pipe(
          concatMap((result: HttpResultOfString) => {
            this.commentsList.forEach((c: any) => {
              const comment: any = { content: c.content };
              commentsObs.push(
                this._workItemsClient.comment(
                  result.result,
                  environment.apiVersion,
                  comment
                )
              );
            });
            return forkJoin(commentsObs.length > 0 ? commentsObs : [of(null)]);
          }),
          mergeMap((result: unknown) => this.postAttachments())
        )
        .subscribe((data: any) => {
          this.activeModal.close(value);
        });
    } else {
      this._workItemsClient
        .update(this.task.id, environment.apiVersion, taskObj)
        .subscribe((data) => {
          if (this.taskAttachments !== this.attachmentsList) {
            this.postAttachments();
          }
          if (this.taskComments !== this.commentsList) {
            let difference = this.commentsList.filter(
              (x) => !this.taskComments.includes(x)
            );
            difference.forEach((c: any) => {
              this._workItemsClient.comment(this.task.id, '1', c).subscribe((d) => {});
            });
          }
          this.activeModal.close(value);
        });
    }
  }
}
