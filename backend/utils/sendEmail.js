const nodemailer = require('nodemailer');

// إعداد الناقل المحلي عبر Mailpit
const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025, // بورت Mailpit في Laragon
    secure: false
});

const sendOrderConfirmationEmail = async (customerEmail, orderDetails) => {
    try {
        const itemsHtml = orderDetails.items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; text-align: center;">
          <img src="${item.image || item.product?.image || 'https://via.placeholder.com/60'}" 
               alt="${item.name || item.product?.name}" 
               style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" />
        </td>
        <td style="padding: 10px; font-weight: bold; color: #333;">
          ${item.name || item.product?.name}
        </td>
        <td style="padding: 10px; text-align: center; color: #666;">
          x${item.orderQuantity || item.quantity || 1}
        </td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #f59e0b;">
          $${(item.price * (item.orderQuantity || item.quantity || 1)).toFixed(2)}
        </td>
      </tr>
    `).join('');

        const mailOptions = {
            from: '"CraveCraft Burger 🍔" <no-reply@cravecraft.com>',
            to: customerEmail || 'customer@example.com',
            subject: `تأكيد طلبك رقم #${orderDetails._id}`,
            html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <h1 style="color: #f59e0b; margin: 0; font-size: 24px;">CraveCraft Burger 🍔</h1>
            <p style="color: #94a3b8; margin-top: 5px; font-size: 14px;">شكراً لطلبك! تم إستلام طلبك بنجاح</p>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px; color: #1e293b;">مرحباً <b>${orderDetails.userDetails?.fullName || 'عميلنا العزيز'}</b>،</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              يسعدنا إبلاغك بأن طلبك يتم تجهيزه الآن وسيكون جاهزاً للتوصيل قريباً!
            </p>
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 15px; margin: 20px 0;">
              <p style="margin: 5px 0; color: #334155;"><b>رقم الطلب:</b> <span style="color: #f59e0b;">#${orderDetails._id}</span></p>
              <p style="margin: 5px 0; color: #334155;"><b>وقت التوصيل المتوقع:</b> <span style="color: #10b981; font-weight: bold;">خلال 24 ساعة (يوم واحد) 🚚</span></p>
            </div>
            <h3 style="color: #0f172a; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">تفاصيل الطلب:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f1f5f9; color: #475569; font-size: 12px;">
                  <th style="padding: 8px;">الصورة</th>
                  <th style="padding: 8px; text-align: right;">المنتج</th>
                  <th style="padding: 8px; text-align: center;">الكمية</th>
                  <th style="padding: 8px; text-align: right;">السعر</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div style="text-align: left; margin-top: 20px; padding-top: 15px; border-top: 2px solid #f1f5f9;">
              <h2 style="color: #0f172a; margin: 0;">الإجمالي الكلي: <span style="color: #f59e0b;">$${orderDetails.totalAmount || 0}</span></h2>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            إذا كان لديك أي استفسار لا تتردد في التواصل معنا. نتمنى لك وجبة شهية! ❤️
          </div>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log('تم إرسال الإيميل لمحاكي Mailpit بنجاح 🚀');
    } catch (error) {
        console.error('خطأ في إرسال البريد:', error.message);
    }
};

module.exports = sendOrderConfirmationEmail;