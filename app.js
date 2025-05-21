document.addEventListener('DOMContentLoaded', () => {
    const ibanInput = document.getElementById('iban');
    const amountInput = document.getElementById('amount');
    const generateBtn = document.getElementById('generateBtn');
    const qrcodeContainer = document.getElementById('qrcodeContainer');
    const errorMessageDiv = document.getElementById('errorMessage');
    let qrCodeInstance = null; // لتتبع نسخة QRCode الحالية

    generateBtn.addEventListener('click', () => {
        const iban = ibanInput.value.trim();
        const amount = amountInput.value.trim(); // القيمة ستكون سلسلة نصية

        // مسح رسالة الخطأ السابقة
        errorMessageDiv.textContent = '';

        // التحقق من أن IBAN ليس فارغًا
        if (!iban) {
            errorMessageDiv.textContent = 'الرجاء إدخال رقم IBAN.';
            // مسح أي رمز QR سابق إذا كان IBAN فارغًا
            if (qrCodeInstance) {
                qrcodeContainer.innerHTML = '<p>سيتم عرض رمز QR هنا</p>';
                qrCodeInstance = null;
            }
            return;
        }

        // تكوين كائن البيانات
        const data = {
            iban: iban
        };

        // إضافة المبلغ فقط إذا تم إدخاله
        // إذا كان المبلغ فارغًا، سيتم إرسال سلسلة فارغة كما هو مطلوب
        data.amount = amount;


        // تحويل الكائن إلى سلسلة JSON
        const jsonString = JSON.stringify(data);

        // مسح رمز QR السابق قبل إنشاء واحد جديد
        qrcodeContainer.innerHTML = ''; 

        // إنشاء رمز QR جديد
        try {
            qrCodeInstance = new QRCode(qrcodeContainer, {
                text: jsonString,
                width: 256,
                height: 256,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H 
            });
        } catch (error) {
            console.error("خطأ في توليد رمز QR:", error);
            errorMessageDiv.textContent = 'حدث خطأ أثناء توليد رمز QR. الرجاء التحقق من المدخلات.';
            qrcodeContainer.innerHTML = '<p>فشل توليد رمز QR</p>';
        }
    });
});
