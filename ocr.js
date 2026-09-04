const OCRManager = {
    async processImage(file, onProgress) {
        return new Promise((resolve, reject) => {
            // Конвертация HEIC или других форматов в изображение для Tesseract
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = async () => {
                try {
                    const result = await Tesseract.recognize(
                        img,
                        'rus', // Русский язык
                        {
                            logger: m => {
                                if (m.status === 'recognizing text') {
                                    onProgress(Math.round(m.progress * 100));
                                }
                            }
                        }
                    );
                    resolve(result.data.text);
                } catch (error) {
                    reject(error);
                } finally {
                    URL.revokeObjectURL(url);
                }
            };
            img.onerror = () => reject(new Error("Ошибка загрузки изображения"));
            img.src = url;
        });
    }
};