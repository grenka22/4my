const Editor = {
    currentDay: 1,
    currentWeek: 'odd',
    tempSchedule: [],

    init(day, weekType) {
        console.log('Editor init:', day, weekType);
        this.currentDay = day;
        this.currentWeek = weekType;
        
        // Загружаем существующие уроки или создаём пустой массив
        const existingLessons = DataManager.getDaySchedule(day, weekType);
        this.tempSchedule = existingLessons.length > 0 
            ? JSON.parse(JSON.stringify(existingLessons)) 
            : [];
        
        console.log('Loaded lessons:', this.tempSchedule);
        this.updateDayButtons();
        this.render();
    },

    updateDayButtons() {
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.day) === this.currentDay);
        });
    },

    render() {
        console.log('Rendering lessons:', this.tempSchedule.length);
        const container = document.getElementById('editor-list');
        if (!container) {
            console.error('Editor list container not found');
            return;
        }
        
        container.innerHTML = '';

        if (this.tempSchedule.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); margin-top:40px;">Нет уроков. Нажмите «+ Урок» чтобы добавить первый</p>';
            return;
        }

        this.tempSchedule.forEach((lesson, index) => {
            console.log(`Rendering lesson ${index}:`, lesson);
            
            // Разбиваем время на начало и конец
            const [startTime, endTime] = lesson.time ? lesson.time.split(/[-–]/) : ['08:00', '08:45'];
            
            const div = document.createElement('div');
            div.className = 'editor-item';
            div.innerHTML = `
                <div class="editor-item-header">
                    <span class="lesson-number">Урок ${index + 1}</span>
                    <button class="btn-delete" data-index="${index}">✕</button>
                </div>
                <div class="editor-item-row">
                    <div class="time-picker-group">
                        <label>Начало</label>
                        <input type="time" value="${startTime}" data-index="${index}" data-field="startTime" class="time-input">
                    </div>
                    <div class="time-picker-group">
                        <label>Конец</label>
                        <input type="time" value="${endTime}" data-index="${index}" data-field="endTime" class="time-input">
                    </div>
                </div>
                <input type="text" value="${this.escapeHtml(lesson.name)}" data-index="${index}" data-field="name" placeholder="Предмет" class="editor-input">
                <input type="text" value="${this.escapeHtml(lesson.extra)}" data-index="${index}" data-field="extra" placeholder="Кабинет / Учитель" class="editor-input">
            `;
            container.appendChild(div);
        });

        // Навешиваем обработчики
        this.attachEventListeners();
    },

    attachEventListeners() {
        const container = document.getElementById('editor-list');
        if (!container) return;

        // Обработчики полей ввода
        container.querySelectorAll('.editor-item input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                
                console.log(`Input changed: index=${idx}, field=${field}, value=${e.target.value}`);
                
                if (field === 'startTime' || field === 'endTime') {
                    // Обновляем поле time в формате "08:00-08:45"
                    const currentLesson = this.tempSchedule[idx];
                    const [currentStart, currentEnd] = currentLesson.time ? currentLesson.time.split(/[-–]/) : ['08:00', '08:45'];
                    
                    if (field === 'startTime') {
                        currentLesson.time = `${e.target.value}-${currentEnd}`;
                    } else {
                        currentLesson.time = `${currentStart}-${e.target.value}`;
                    }
                } else {
                    this.tempSchedule[idx][field] = e.target.value;
                }
                
                console.log('Updated lesson:', this.tempSchedule[idx]);
            });
        });

        // Обработчики удаления
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(e.target.dataset.index);
                console.log('Deleting lesson at index:', idx);
                
                this.tempSchedule.splice(idx, 1);
                console.log('After delete:', this.tempSchedule);
                this.render();
            });
        });
    },

    addLesson() {
        console.log('Adding new lesson');
        console.log('Current schedule:', this.tempSchedule);
        
        const newLesson = { 
            time: "08:00-08:45", 
            name: "Новый урок", 
            extra: "",
            homework: ""
        };
        
        this.tempSchedule.push(newLesson);
        console.log('After add:', this.tempSchedule);
        
        this.render();
        
        // Прокручиваем к новому уроку
        setTimeout(() => {
            const editorList = document.getElementById('editor-list');
            if (editorList) {
                editorList.scrollTop = editorList.scrollHeight;
            }
        }, 100);
    },

    save() {
        console.log('Saving schedule:', this.tempSchedule);
        
        if (this.tempSchedule.length === 0) {
            if (confirm('Список уроков пуст. Сохранить?')) {
                DataManager.setDaySchedule(this.currentDay, [], this.currentWeek);
                App.showView('home');
                Render.renderAll();
            }
            return;
        }
        
        DataManager.setDaySchedule(this.currentDay, this.tempSchedule, this.currentWeek);
        console.log('Saved successfully');
        
        App.showView('home');
        Render.renderAll();
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Навешиваем обработчики на кнопки дней
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const day = parseInt(e.target.dataset.day);
            console.log('Day button clicked:', day);
            Editor.init(day, Editor.currentWeek);
        });
    });

    // Кнопка добавления урока
    const btnAddLesson = document.getElementById('btn-add-lesson');
    if (btnAddLesson) {
        btnAddLesson.addEventListener('click', () => {
            console.log('Add lesson button clicked');
            Editor.addLesson();
        });
    } else {
        console.error('Add lesson button not found');
    }

    // Кнопки сохранения/отмены
    const btnSave = document.getElementById('btn-save-editor');
    if (btnSave) {
        btnSave.addEventListener('click', () => Editor.save());
    }

    const btnCancel = document.getElementById('btn-cancel-editor');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => App.showView('home'));
    }
});