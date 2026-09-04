const Parser = {
    parse(ocrText) {
        const lines = ocrText.split('\n').filter(line => line.trim().length > 0);
        const schedule = {};
        
        // Инициализируем дни недели (1-Пн ... 6-Сб)
        for (let i = 1; i <= 6; i++) {
            schedule[i] = [];
        }

        let currentDay = 1; // По умолчанию пн
        
        // Простой эвристический парсер для табличного формата
        // Ищет строки вида: "1 | 08:00-08:45 | Математика | каб. 301"
        const timeRegex = /(\d{2}:\d{2}\s*[-–]\s*\d{2}:\d{2})/;
        
        lines.forEach(line => {
            // Попытка определить день недели по заголовку (если OCR его распознал)
            if (line.match(/понедельник|пн/i)) currentDay = 1;
            else if (line.match(/вторник|вт/i)) currentDay = 2;
            else if (line.match(/среда|ср/i)) currentDay = 3;
            else if (line.match(/четверг|чт/i)) currentDay = 4;
            else if (line.match(/пятница|пт/i)) currentDay = 5;
            else if (line.match(/суббота|сб/i)) currentDay = 6;

            // Ищем время урока
            const timeMatch = line.match(timeRegex);
            if (timeMatch) {
                const time = timeMatch[1].replace(/\s+/g, ''); // убираем пробелы вокруг тире
                
                // Разбиваем строку по разделителям | или множественным пробелам
                const parts = line.split(/[\|]{1,}| {3,}/).map(p => p.trim()).filter(p => p.length > 0);
                
                // Находим часть с названием предмета (обычно самая длинная или после времени)
                let subject = "Неизвестно";
                let extra = "";
                
                for (let part of parts) {
                    if (!part.match(/^\d+$/) && !part.includes(':') && part.length > 2) {
                        if (!subject.includes('каб') && !subject.match(/[А-Яа-я]+\./)) {
                            subject = part;
                        } else {
                            extra = part;
                        }
                    }
                }

                // Если не удалось нормально распарсить, берем всю строку после времени
                if (subject === "Неизвестно") {
                    const afterTime = line.split(timeMatch[1])[1];
                    subject = afterTime.replace(/[\|]/g, '').trim().substring(0, 30);
                }

                schedule[currentDay].push({
                    time: time,
                    name: subject,
                    extra: extra || ""
                });
            }
        });

        // Сортируем уроки по времени
        for (let day in schedule) {
            schedule[day].sort((a, b) => a.time.localeCompare(b.time));
        }

        return schedule;
    }
};