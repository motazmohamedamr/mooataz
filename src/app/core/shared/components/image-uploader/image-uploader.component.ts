import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'image-uploader',
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.scss']
})
export class ImageUploaderComponent implements OnInit{
 
  imageUrl: string | ArrayBuffer | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

   ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  selectedFile: any;

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.imageUrl = reader.result as string;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  removePhoto(event: Event) {
    event.stopPropagation(); // Prevent event bubbling
    this.imageUrl = null;
    this.selectedFile = null;
  }
  
}