import { Component, HostBinding, OnInit } from '@angular/core';

@Component({
  selector: 'app-dropdown-menu1',
  templateUrl: './dropdown-menu1.component.html',
})
export class DropdownMenu1Component implements OnInit {
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';

  constructor() {}

  ngOnInit(): void {}
}
