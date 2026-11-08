import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslateModule, IconComponent],
  template: `
    <footer class="footer">
      <div class="container footer__grid">
        <div>
          <div class="footer__brand">{{ storeName }}</div>
          <p class="footer__text">{{ 'footer.about' | translate }}</p>
        </div>
        <div>
          <h3>{{ 'footer.contact' | translate }}</h3>
          <p><a [href]="'tel:' + phone" class="footer__link"><app-icon name="phone" [size]="18" /> <span dir="ltr">{{ phone }}</span></a></p>
          <p class="footer__text"><app-icon name="truck" [size]="18" /> {{ 'footer.delivery' | translate }}</p>
        </div>
        <div>
          <h3>{{ 'footer.links' | translate }}</h3>
          <p><a routerLink="/favorites" class="footer__link">{{ 'nav.favorites' | translate }}</a></p>
          <p><a routerLink="/cart" class="footer__link">{{ 'nav.cart' | translate }}</a></p>
        </div>
      </div>
      <div class="container footer__bottom">
        <span>&copy; {{ year }} {{ storeName }}. {{ 'footer.rights' | translate }}</span>
        <a routerLink="/manager/login" class="footer__link footer__staff">{{ 'footer.staff' | translate }}</a>
      </div>
    </footer>
  `,
  styles: [`
    .footer { background: var(--ink); color: #e9efe9; margin-top: 4rem; padding-top: 3rem; }
    .footer__grid { display: grid; gap: 2rem; grid-template-columns: 2fr 1.3fr 1fr; padding-bottom: 2rem; }
    .footer h3 { color: #fff; font-size: 1rem; }
    .footer__brand { font-family: var(--font-display); font-size: 1.6rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff; }
    .footer__text { color: #b9c9c0; display: flex; gap: 0.5rem; align-items: center; margin: 0 0 0.6rem; }
    .footer__link { color: #e9efe9; text-decoration: none; display: inline-flex; gap: 0.5rem; align-items: center; }
    .footer__link:hover { color: #ffb596; }
    .footer__bottom { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.14); padding-block: 1.1rem; font-size: 0.88rem; color: #b9c9c0; }
    .footer__staff { opacity: 0.7; font-size: 0.85rem; }
    @media (max-width: 720px) { .footer__grid { grid-template-columns: 1fr; } }
  `]
})
export class FooterComponent {
  readonly storeName = environment.storeName;
  readonly phone = environment.storePhone;
  readonly year = new Date().getFullYear();
}
