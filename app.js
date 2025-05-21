function isValidIBAN(iban) {
    // إزالة المسافات وتحويل الحروف إلى كبيرة
    const ibanUpper = iban.replace(/\s+/g, '').toUpperCase();

    // التحقق من الطول الأساسي وأنه يبدأ بـ BH (خاص بالبحرين)
    if (ibanUpper.length !== 22 || !ibanUpper.startsWith('BH')) {
        return false;
    }

    // نقل أول أربعة أحرف إلى النهاية
    const rearrangedIBAN = ibanUpper.substring(4) + ibanUpper.substring(0, 4);

    // استبدال الحروف بأرقام (A=10, B=11, ..., Z=35)
    let numericIBAN = '';
    for (let i = 0; i < rearrangedIBAN.length; i++) {
        const char = rearrangedIBAN.charAt(i);
        if (char >= '0' && char <= '9') {
            numericIBAN += char;
        } else {
            numericIBAN += (char.charCodeAt(0) - 'A'.charCodeAt(0) + 10).toString();
        }
    }

    // التحقق من باقي القسمة على 97
    // للتعامل مع الأرقام الكبيرة، نقوم بالعملية على أجزاء
    let remainder = 0;
    for (let i = 0; i < numericIBAN.length; i++) {
        remainder = (remainder * 10 + parseInt(numericIBAN.charAt(i), 10)) % 97;
    }
    
    return remainder === 1;
}

document.addEventListener('DOMContentLoaded', () => {
    const ibanInput = document.getElementById('iban');
    const amountInput = document.getElementById('amount');
    const generateBtn = document.getElementById('generateBtn');
    const qrcodeContainer = document.getElementById('qrcodeContainer');
    const errorMessageDiv = document.getElementById('errorMessage');
    let qrCodeInstance = null; // لتتبع نسخة QRCode الحالية

    const downloadOptionsDiv = document.getElementById('downloadOptions');
    // const downloadBtn = document.getElementById('downloadBtn'); // تم الحذف
    let lastValidJsonString = null; // لتخزين آخر JSON صالح تم توليده

    generateBtn.addEventListener('click', () => {
        const iban = ibanInput.value.trim();
        const amount = amountInput.value.trim(); // القيمة ستكون سلسلة نصية

        // مسح رسالة الخطأ السابقة
        errorMessageDiv.textContent = '';

        // التحقق من أن IBAN ليس فارغًا
        if (!iban) {
            errorMessageDiv.textContent = 'الرجاء إدخال رقم IBAN.';
            if (qrCodeInstance) {
                qrcodeContainer.innerHTML = '<p>سيتم عرض رمز QR هنا</p>';
                qrCodeInstance = null;
            }
            lastValidJsonString = null;
            downloadOptionsDiv.style.display = 'none';
            return;
        }

        // التحقق من صحة IBAN
        if (!isValidIBAN(iban)) {
            errorMessageDiv.textContent = 'رقم IBAN الذي أدخلته غير صالح. يرجى التحقق منه (يجب أن يبدأ بـ BH ويتكون من 22 حرفًا صحيحًا).';
            if (qrCodeInstance) {
                qrcodeContainer.innerHTML = '<p>سيتم عرض رمز QR هنا</p>';
                qrCodeInstance = null;
            }
            lastValidJsonString = null;
            downloadOptionsDiv.style.display = 'none';
            return;
        }

        // التحقق من المبلغ إذا تم إدخاله
        if (amount !== '') { // فقط إذا لم يكن حقل المبلغ فارغًا
            const numericAmount = parseFloat(amount);
            if (isNaN(numericAmount) || numericAmount <= 0) {
                errorMessageDiv.textContent = 'إذا تم إدخال مبلغ، فيجب أن يكون أكبر من الصفر.';
                if (qrCodeInstance) {
                    qrcodeContainer.innerHTML = '<p>سيتم عرض رمز QR هنا</p>';
                    qrCodeInstance = null;
                }
                lastValidJsonString = null;
                downloadOptionsDiv.style.display = 'none';
                return;
            }
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
            lastValidJsonString = null; 
            downloadOptionsDiv.style.display = 'none'; 
            return; 
        }

        // إذا نجح التوليد
        lastValidJsonString = jsonString;
        downloadOptionsDiv.style.display = 'block'; 
    });

    // تم حذف معالج الحدث الخاص بـ downloadBtn

    const downloadSizeSelector = document.querySelector('.download-size-selector');

    if (downloadSizeSelector) { // تأكد من وجود العنصر قبل إضافة المستمع
        downloadSizeSelector.addEventListener('click', (event) => {
            const clickedLabel = event.target.closest('.size-option');

            if (!clickedLabel) {
                return; // النقرة لم تكن على أحد خيارات الحجم
            }

            const radioInput = clickedLabel.querySelector('input[type="radio"]');
            if (!radioInput) {
                console.error('لم يتم العثور على input radio داخل .size-option');
                return;
            }

            // تأكد من تحديد الراديو الموافق للـ label الذي تم النقر عليه
            if (!radioInput.checked) {
                 radioInput.checked = true;
            }

            const size = parseInt(radioInput.value, 10);

            if (!lastValidJsonString) {
                // هذا الشرط يجب ألا يتحقق عادةً لأن قسم الخيارات يكون مخفيًا
                // ولكن كإجراء احترازي
                alert('يرجى توليد رمز QR أولاً.');
                return;
            }

            // إنشاء حاوية مؤقتة لتوليد رمز QR بحجم التنزيل المطلوب
            const tempQrContainer = document.createElement('div');
            // لا تحتاج إلى إضافتها إلى DOM للعرض، qrcode.js يمكنه العمل مع عنصر غير متصل

            try {
                // توليد رمز QR في الحاوية المؤقتة
                new QRCode(tempQrContainer, {
                    text: lastValidJsonString,
                    width: size,
                    height: size,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });

                // الحصول على عنصر canvas الذي تم إنشاؤه بواسطة qrcode.js
                const canvas = tempQrContainer.querySelector('canvas');
                if (canvas) {
                    const dataUrl = canvas.toDataURL('image/png');
                    
                    // إنشاء رابط وهمي لتنزيل الصورة
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = `benefit_qr_${size}px.png`; // اسم الملف المقترح
                    
                    // إضافته إلى DOM، النقر عليه، ثم إزالته
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                } else {
                    console.error('لم يتم العثور على Canvas لتنزيل رمز QR.');
                    alert('حدث خطأ أثناء إعداد ملف التنزيل.');
                }

            } catch (error) {
                console.error("خطأ في توليد رمز QR للتنزيل:", error);
                alert('حدث خطأ أثناء توليد رمز QR للتنزيل.');
            }
        });
    }
});
