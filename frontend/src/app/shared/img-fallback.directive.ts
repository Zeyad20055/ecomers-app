import { Directive, HostListener } from '@angular/core';

/** Replaces a broken image with the bundled placeholder. */
@Directive({ selector: 'img[appFallback]' })
export class ImgFallbackDirective {
  @HostListener('error', ['$event.target'])
  onError(img: HTMLImageElement): void {
    if (!img.src.endsWith('placeholder.svg')) img.src = 'assets/images/placeholder.svg';
  }
}
