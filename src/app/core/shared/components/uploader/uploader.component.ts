import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Upload } from '../file-upload/upload';
import { PhotoStatus } from 'src/app/core/enums/photoStatus';
import { UploadType } from '../file-upload/upload-type';


@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.scss']
})
export class UploaderComponent implements OnInit {
  @Input() url: any;
  @Output() onLoadFile = new EventEmitter<Upload>();

  upload = new Upload();

  isImageSaved: boolean;
  imageError: string;
  fileName: string;
  constructor() { }

  ngOnInit(): void {
    if (this.url != null && this.url != '') {
      this.isImageSaved = true;
    }
  }

  removeImage() {
    this.upload = new Upload();
    this.upload.photoStatus = PhotoStatus.Deleted;

    this.isImageSaved = false;
    this.url = null;
    this.onLoadFile.emit(this.upload);
  }

  onSelectFile(event :any) {

    //this.selectedFiles = event.target.files;
    this.imageError = "";
    if (event.target.files && event.target.files[0]) {

      // Size Filter Bytes
      const max_size = 20971520;
      const allowed_types = ['image/png', 'image/jpeg', 'image/jpg'];
      const max_height = 15200;
      const max_width = 25600;

      if (!allowed_types.includes(event.target.files[0].type)) {
        this.imageError = 'Only Images are allowed ( JPG | PNG )';
        return false;
      }
      var reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]); // read file as data url
      reader.onload = (e: any) => {
        const image = new Image();
        image.src = e.target.result;
        image.onload = (rs:any) => {
          const img_height = rs.currentTarget['height'];
          const img_width = rs.currentTarget['width'];
          if (event.target.files[0].size > max_size) {
            this.imageError =
              'Maximum size allowed is ' + max_size / 1000 + 'Mb';

            return false;
          }

          if (img_height > max_height && img_width > max_width) {
            this.imageError =
              'Maximum dimentions allowed ' +
              max_height +
              '*' +
              max_width +
              'px';
            return false;
          } else {
            const imgBase64Path = e.target.result;
            // this.ImageBase64 = imgBase64Path;
            this.isImageSaved = true;
            // this.previewImagePath = imgBase64Path;
          }
        };
      };
      this.upload.fileName = event.target.files[0].name.split('.').shift()
      this.upload.extension = event.target.files[0].name.split('.').pop();
      this.upload.uploadType = UploadType.Product;
      this.upload.photoStatus = PhotoStatus.Insrted;

      reader.onloadend = (event:any) => { // called once readAsDataURL is completed
        this.url = event.target.result;
        this.isImageSaved = true;
        this.upload.data = event.target.result;
        this.onLoadFile.emit(this.upload);
      }


    }
  }

}
