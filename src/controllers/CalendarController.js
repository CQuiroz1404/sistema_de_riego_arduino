const CalendarController = {
    index: (req, res) => {
        res.render('calendar/index', {
            title: 'Calendario de Riego',
            user: req.user
        });
    }
};

module.exports = CalendarController;
