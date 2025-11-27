const Router = {
    navigate: (route) => {
        if (route === 'lobby') View.updateLobby(Model.roomCode, Model.participants);
        if (route === 'swipe') View.renderCard(Model.restaurants[Model.currentIndex], 5);
        if (route === 'match') View.renderMatches(Model.matches);
        View.showSection(route);
    }
};