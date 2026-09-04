const App = {
    init() {
        console.log('App initializing...');
        Render.renderAll();

        // Кнопка загрузки фото
        const btnUpload = document.getElementById('btn-upload');
        if (btnUpload) {
            btnUpload.addEventListener('click', () => this.showView('upload'));
        }

        // Кнопка отмены загрузки
        const btnCancelUpload = document.getElementById('btn-cancel-upload');
        if (btnCancelUpload) {
            btnCancelUpload.addEventListener('click', () => this.showView('home'));
        }

        // Кнопка ручного редактирования
        const btnEditManual = document.getElementById('btn-edit-manual');
        if (btnEditManual) {
            btnEditManual.addEventListener('click', () => {
                Editor.init(Render.selectedDay, Render.currentWeek);
                this.showView('editor');
            });
        }

        // Загрузка файла
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                await this.handleFileUpload(e);
            });
        }

        console.log('App initialized successfully');
    },

    async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic'];
        if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
            alert('Выберите изображение (JPG, PNG, HEIC)');
            e.target.value = '';
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            alert('Файл слишком большой. Максимум 20 МБ');
            e.target.value = '';
            return;
        }

        const progressContainer = document.getElementById('ocr-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        if (!progressContainer || !progressFill || !progressText) {
            alert('Ошибка интерфейса. Обновите страницу.');
            return;
        }

        progressContainer.classList.remove('hidden');
        progressFill.style.width = '0%';
        progressText.textContent = 'Подготовка...';

        try {
            if (typeof Tesseract === 'undefined') {
                throw new Error('Tesseract.js не загружен. Проверьте интернет.');
            }

            console.log('Обработка файла:', file.name);
            progressText.textContent = 'Загрузка...';

            const text = await OCRManager.processImage(file, (percent) => {
                progressFill.style.width = `${percent}%`;
                progressText.textContent = `Распознавание: ${percent}%`;
            });

            console.log('Распознанный текст:', text);

            if (!text || text.trim().length === 0) {
                throw new Error('Текст не распознан. Попробуйте другое фото.');
            }

            progressText.textContent = 'Обработка...';
            const parsedSchedule = Parser.parse(text);
            
            let lessonsCount = 0;
            for (let day = 1; day <= 6; day++) {
                if (parsedSchedule[day] && parsedSchedule[day].length > 0) {
                    DataManager.setDaySchedule(day, parsedSchedule[day], 'odd');
                    lessonsCount += parsedSchedule[day].length;
                }
            }

            if (lessonsCount === 0) {
                throw new Error('Не найдены уроки. Убедитесь что на фото таблица.');
            }

            console.log(`Распознано уроков: ${lessonsCount}`);
            progressText.textContent = `Готово! ${lessonsCount} уроков.`;

            setTimeout(() => {
                Editor.init(1, 'odd');
                this.showView('editor');
            }, 500);

        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка: ' + error.message);
            progressContainer.classList.add('hidden');
        } finally {
            setTimeout(() => {
                progressFill.style.width = '0%';
                e.target.value = '';
            }, 1000);
        }
    },

    showView(viewName) {
        console.log('Переключение:', viewName);
        
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
        });

        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.add('active');
        } else {
            console.error(`View "${viewName}" не найдена`);
            return;
        }

        const titles = {
            'home': 'Расписание',
            'upload': 'Загрузка фото',
            'editor': 'Редактор'
        };
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = titles[viewName] || 'Расписание';
        }

        if (viewName === 'home') {
            Render.renderAll();
        }

        if (viewName !== 'upload') {
            const progressContainer = document.getElementById('ocr-progress');
            if (progressContainer) {
                progressContainer.classList.add('hidden');
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    try {
        App.init();
        console.log('App initialized');
    } catch (error) {
        console.error('Error:', error);
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('SW registered:', reg.scope))
                .catch(err => console.log('SW failed:', err));
        }
    });
}