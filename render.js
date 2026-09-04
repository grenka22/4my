const Render = {
    currentWeek: 'odd',
    selectedDay: (() => {
        const d = new Date().getDay();
        return d === 0 ? 7 : d; // Вс = 7, Пн-Сб = 1-6
    })(),
    editingHomework: null, // { day, index, week }

    renderAll() {
        this.renderSmartCard();
        this.renderTabs();
        this.renderLessons();
    },

    // ===== УМНАЯ КАРТОЧКА С ДЗ СПРАВА =====
    renderSmartCard() {
        const now = new Date();
        const day = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hours * 60 + minutes;
        const cardContent = document.getElementById('smart-card-content');
        if (!cardContent) return;

        const dayNamesShort = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

        // Определяем завтрашний день
        let tomorrowDay = day + 1;
        if (tomorrowDay === 7) tomorrowDay = 1;
        if (day === 0) tomorrowDay = 1;

        const todayLessons = DataManager.getDaySchedule(day === 0 ? 7 : day, this.currentWeek);
        const tomorrowLessons = DataManager.getDaySchedule(tomorrowDay, this.currentWeek);

        // ===== ВЫХОДНОЙ =====
        if (day === 0 || day === 6) {
            if (tomorrowLessons && tomorrowLessons.length > 0) {
                const homeworkCount = tomorrowLessons.filter(l => l.homework).length;
                let html = `📖 Выходной<br><span style='font-size:15px; opacity:0.9'>Завтра (${dayNamesShort[tomorrowDay]}): ${tomorrowLessons.length} уроков`;
                if (homeworkCount > 0) html += ` • 📝 ${homeworkCount} ДЗ`;
                html += `</span>`;
                
                // Уроки с ДЗ справа
                html += `<div style='margin-top:12px;'>`;
                tomorrowLessons.slice(0, 4).forEach(l => {
                    html += `<div class='card-lesson-row'>
                        <span class='card-lesson-main'>${l.time} ${this.escapeHtml(l.name)}</span>
                        ${l.homework ? `<span class='card-lesson-hw'>📝 ${this.escapeHtml(l.homework)}</span>` : ''}
                    </div>`;
                });
                if (tomorrowLessons.length > 4) {
                    html += `<div style='font-size:12px; opacity:0.7; margin-top:6px;'>и ещё ${tomorrowLessons.length - 4} уроков</div>`;
                }
                html += `</div>`;
                
                cardContent.innerHTML = html;
            } else {
                cardContent.innerHTML = " Выходной<br><span style='font-size:16px; opacity:0.8'>Завтра уроков нет</span>";
            }
            return;
        }

        // ===== НЕТ УРОКОВ СЕГОДНЯ =====
        if (!todayLessons || todayLessons.length === 0) {
            if (tomorrowLessons && tomorrowLessons.length > 0) {
                let html = `📅 Сегодня нет уроков<br><span style='font-size:14px; opacity:0.8'>Завтра (${dayNamesShort[tomorrowDay]}):</span>`;
                html += `<div style='margin-top:10px;'>`;
                tomorrowLessons.slice(0, 4).forEach(l => {
                    html += `<div class='card-lesson-row'>
                        <span class='card-lesson-main'>${l.time} ${this.escapeHtml(l.name)}</span>
                        ${l.homework ? `<span class='card-lesson-hw'>📝 ${this.escapeHtml(l.homework)}</span>` : ''}
                    </div>`;
                });
                html += `</div>`;
                cardContent.innerHTML = html;
            } else {
                cardContent.innerHTML = "📅 Нет уроков<br><span style='font-size:16px; opacity:0.8'>Добавьте расписание</span>";
            }
            return;
        }

        // ===== ИЩЕМ ТЕКУЩИЙ И СЛЕДУЮЩИЙ УРОК =====
        let currentLesson = null;
        let nextLesson = null;

        for (let i = 0; i < todayLessons.length; i++) {
            const [start, end] = todayLessons[i].time.split(/[-–]/);
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            const startTime = sh * 60 + sm;
            const endTime = eh * 60 + em;

            if (currentTime >= startTime && currentTime <= endTime) {
                currentLesson = todayLessons[i];
                nextLesson = todayLessons[i + 1] || null;
                break;
            } else if (currentTime < startTime) {
                nextLesson = todayLessons[i];
                break;
            }
        }

        // ===== ТЕКУЩИЙ УРОК =====
        if (currentLesson) {
            const [, end] = currentLesson.time.split(/[-–]/);
            cardContent.innerHTML = `
                <div class='card-lesson-row'>
                    <span class='card-lesson-main'>📖 ${this.escapeHtml(currentLesson.name)} <span style='opacity:0.7; font-size:15px'>до ${end}</span></span>
                    ${currentLesson.homework ? `<span class='card-lesson-hw'> ${this.escapeHtml(currentLesson.homework)}</span>` : ''}
                </div>
            `;
        } 
        // ===== СЛЕДУЮЩИЙ УРОК =====
        else if (nextLesson) {
            const [start] = nextLesson.time.split(/[-–]/);
            cardContent.innerHTML = `
                <div class='card-lesson-row'>
                    <span class='card-lesson-main'>☀️ ${this.escapeHtml(nextLesson.name)} <span style='opacity:0.7; font-size:15px'>в ${start}</span></span>
                    ${nextLesson.homework ? `<span class='card-lesson-hw'>📝 ${this.escapeHtml(nextLesson.homework)}</span>` : ''}
                </div>
            `;
        } 
        // ===== ДЕНЬ ЗАКОНЧИЛСЯ =====
        else {
            if (tomorrowLessons && tomorrowLessons.length > 0) {
                let html = `📅 День закончился<br><span style='font-size:14px; opacity:0.85'>Завтра (${dayNamesShort[tomorrowDay]}): ${tomorrowLessons.length} уроков</span>`;
                html += `<div style='margin-top:10px;'>`;
                tomorrowLessons.slice(0, 4).forEach(l => {
                    html += `<div class='card-lesson-row'>
                        <span class='card-lesson-main'>${l.time} ${this.escapeHtml(l.name)}</span>
                        ${l.homework ? `<span class='card-lesson-hw'>📝 ${this.escapeHtml(l.homework)}</span>` : ''}
                    </div>`;
                });
                if (tomorrowLessons.length > 4) {
                    html += `<div style='font-size:12px; opacity:0.7; margin-top:6px;'>и ещё ${tomorrowLessons.length - 4} уроков</div>`;
                }
                html += `</div>`;
                cardContent.innerHTML = html;
            } else {
                cardContent.innerHTML = `📅 День закончился<br><span style='font-size:16px; opacity:0.8'>Завтра: ${dayNamesShort[tomorrowDay]}</span>`;
            }
        }
    },

    // ===== ВКЛАДКИ ДНЕЙ =====
    renderTabs() {
        const container = document.getElementById('day-tabs');
        if (!container) return;
        
        container.innerHTML = '';
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const today = new Date().getDay();
        const todayNum = today === 0 ? 7 : today;

        days.forEach((dayName, index) => {
            const dayNum = index + 1;
            const btn = document.createElement('button');
            btn.className = `day-tab ${this.selectedDay === dayNum ? 'active' : ''} ${todayNum === dayNum ? 'today' : ''}`;
            btn.textContent = dayName;
            btn.addEventListener('click', () => {
                this.selectedDay = dayNum;
                this.editingHomework = null;
                this.renderTabs();
                this.renderLessons();
            });
            container.appendChild(btn);
        });
    },

    // ===== СПИСОК УРОКОВ =====
    renderLessons() {
        const container = document.getElementById('lessons-list');
        if (!container) return;
        
        container.innerHTML = '';
        const lessons = DataManager.getDaySchedule(this.selectedDay, this.currentWeek);

        if (!lessons || lessons.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); margin-top:40px;">Нет уроков</p>';
            return;
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const today = now.getDay();
        const todayNum = today === 0 ? 7 : today;
        const isToday = this.selectedDay === todayNum;

        lessons.forEach((lesson, index) => {
            const [start, end] = lesson.time.split(/[-–]/);
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            const startTime = sh * 60 + sm;
            const endTime = eh * 60 + em;

            let statusClass = '';
            if (isToday) {
                if (currentTime >= startTime && currentTime <= endTime) {
                    statusClass = 'current';
                } else if (currentTime < startTime && !container.querySelector('.lesson-item.current')) {
                    statusClass = 'next';
                }
            }

            const div = document.createElement('div');
            div.className = `lesson-item ${statusClass}`;

            // Проверяем, редактируется ли это ДЗ
            const isEditing = this.editingHomework &&
                this.editingHomework.day === this.selectedDay &&
                this.editingHomework.index === index &&
                this.editingHomework.week === this.currentWeek;

            let homeworkHtml = '';

            if (isEditing) {
                // Режим редактирования ДЗ
                homeworkHtml = `
                    <div class="lesson-homework-edit">
                        <textarea class="homework-textarea" placeholder="Введите домашнее задание...">${this.escapeHtml(lesson.homework || '')}</textarea>
                        <div class="homework-actions">
                            <button class="btn-save-homework" data-day="${this.selectedDay}" data-index="${index}" data-week="${this.currentWeek}">
                                💾 Сохранить
                            </button>
                            <button class="btn-cancel-homework">Отмена</button>
                        </div>
                    </div>
                `;
            } else if (lesson.homework) {
                // ДЗ существует
                homeworkHtml = `
                    <div class="lesson-homework">
                        <div class="homework-content">
                            <span class="homework-icon"></span>
                            <span class="homework-text">${this.escapeHtml(lesson.homework)}</span>
                        </div>
                        <div class="homework-buttons">
                            <button class="btn-edit-homework" data-day="${this.selectedDay}" data-index="${index}" data-week="${this.currentWeek}" title="Редактировать">✏️</button>
                            <button class="btn-delete-homework" data-day="${this.selectedDay}" data-index="${index}" data-week="${this.currentWeek}" title="Удалить">🗑️</button>
                        </div>
                    </div>
                `;
            } else {
                // ДЗ нет
                homeworkHtml = `
                    <div class="lesson-homework-empty">
                        <button class="btn-add-homework" data-day="${this.selectedDay}" data-index="${index}" data-week="${this.currentWeek}">
                            + Добавить ДЗ
                        </button>
                    </div>
                `;
            }

            div.innerHTML = `
                <div class="lesson-main">
                    <div class="lesson-time">${lesson.time}</div>
                    <div class="lesson-info">
                        <div class="lesson-name">${index + 1}. ${this.escapeHtml(lesson.name)}</div>
                        ${lesson.extra ? `<div class="lesson-extra">${this.escapeHtml(lesson.extra)}</div>` : ''}
                    </div>
                </div>
                ${homeworkHtml}
            `;
            container.appendChild(div);
        });

        // Навешиваем обработчики
        this.attachHomeworkHandlers();
    },

    // ===== ОБРАБОТЧИКИ ДЗ =====
    attachHomeworkHandlers() {
        const container = document.getElementById('lessons-list');
        if (!container) return;

        // Добавление ДЗ
        container.querySelectorAll('.btn-add-homework').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const day = parseInt(e.target.dataset.day);
                const index = parseInt(e.target.dataset.index);
                const week = e.target.dataset.week;
                this.editingHomework = { day, index, week };
                this.renderLessons();
                setTimeout(() => {
                    const textarea = container.querySelector('.homework-textarea');
                    if (textarea) textarea.focus();
                }, 50);
            });
        });

        // Редактирование ДЗ
        container.querySelectorAll('.btn-edit-homework').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const day = parseInt(e.target.dataset.day);
                const index = parseInt(e.target.dataset.index);
                const week = e.target.dataset.week;
                this.editingHomework = { day, index, week };
                this.renderLessons();
                setTimeout(() => {
                    const textarea = container.querySelector('.homework-textarea');
                    if (textarea) textarea.focus();
                }, 50);
            });
        });

        // Удаление ДЗ
        container.querySelectorAll('.btn-delete-homework').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const day = parseInt(e.target.dataset.day);
                const index = parseInt(e.target.dataset.index);
                const week = e.target.dataset.week;

                if (confirm('Удалить домашнее задание?')) {
                    DataManager.deleteLessonHomework(day, index, week);
                    this.editingHomework = null;
                    this.renderLessons();
                    this.renderSmartCard();
                }
            });
        });

        // Сохранение ДЗ
        container.querySelectorAll('.btn-save-homework').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const day = parseInt(e.target.dataset.day);
                const index = parseInt(e.target.dataset.index);
                const week = e.target.dataset.week;
                const textarea = container.querySelector('.homework-textarea');
                if (textarea) {
                    const homework = textarea.value.trim();
                    DataManager.updateLessonHomework(day, index, homework, week);
                    this.editingHomework = null;
                    this.renderLessons();
                    this.renderSmartCard();
                }
            });
        });

        // Отмена редактирования
        container.querySelectorAll('.btn-cancel-homework').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editingHomework = null;
                this.renderLessons();
            });
        });
    },

    // ===== УТИЛИТЫ =====
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ===== ПЕРЕКЛЮЧАТЕЛЬ НЕДЕЛЬ =====
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            Render.currentWeek = e.target.dataset.week;
            Render.editingHomework = null;
            Render.renderAll();
        });
    });
});