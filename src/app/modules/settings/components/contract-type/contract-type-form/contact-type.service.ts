import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ContactTypeService {

  constructor(private http: HttpClient) {}

  addContactType(data: any): Observable<boolean> {
    return of(true); // Dummy implementation
    // return this.http.post('https://dummyapi.com/addNames', data).pipe(
    //   map(response => true), // Assuming a successful response returns true
    //   catchError(error => {
    //     console.error(error);
    //     return of(false); // In case of error, return false
    //   })
    // );
  }
}
