const app = {
    model: Model,
    view: View,
    controller: Controller,
    router: Router
};

window.onload = () => app.controller.init();
