import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-access-denial',
  templateUrl: './access-denial.component.html',
  styleUrls: ['./access-denial.component.scss']
})
export class AccessDenialComponent implements OnInit {

  constructor(
    public translate: TranslateService,

  ) { }

  ngOnInit(): void {
  }

}
