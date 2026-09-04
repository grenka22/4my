const STORAGE_KEY = 'schoolSchedule';

const DataManager = {
    getSchedule() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : { odd: {}, even: {} };
    },

    saveSchedule(scheduleData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scheduleData));
    },

    getDaySchedule(dayIndex, weekType = 'odd') {
        const data = this.getSchedule();
        return data[weekType][dayIndex] || [];
    },

    setDaySchedule(dayIndex, lessons, weekType = 'odd') {
        const data = this.getSchedule();
        if (!data[weekType]) data[weekType] = {};
        data[weekType][dayIndex] = lessons;
        this.saveSchedule(data);
    },

    updateLessonHomework(dayIndex, lessonIndex, homework, weekType = 'odd') {
        const data = this.getSchedule();
        if (data[weekType] && data[weekType][dayIndex] && data[weekType][dayIndex][lessonIndex]) {
            data[weekType][dayIndex][lessonIndex].homework = homework;
            this.saveSchedule(data);
        }
    },

    deleteLessonHomework(dayIndex, lessonIndex, weekType = 'odd') {
        const data = this.getSchedule();
        if (data[weekType] && data[weekType][dayIndex] && data[weekType][dayIndex][lessonIndex]) {
            data[weekType][dayIndex][lessonIndex].homework = '';
            this.saveSchedule(data);
        }
    },

    clearAll() {
        localStorage.removeItem(STORAGE_KEY);
    }
};