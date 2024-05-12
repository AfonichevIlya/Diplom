document.addEventListener("DOMContentLoaded", () => {
  const trackList = document.getElementById("track-list");
  const favoriteTracks = document.getElementById("favorite-tracks");

  // Функция для загрузки списка треков
  function loadTracks() {
    axios
      .get("/tracks")
      .then((response) => {
        trackList.innerHTML = "";
        response.data.forEach((track) => {
          const li = document.createElement("li");
          li.textContent = track.name;
          const button = document.createElement("button");
          button.textContent = "Добавить в избранное";
          button.addEventListener("click", () => addToFavorites(track));
          li.appendChild(button);
          trackList.appendChild(li);
        });
      })
      .catch((error) => console.error(error));
  }

  // Функция для добавления трека в избранное
  function addToFavorites(track) {
    axios
      .post("/favorites", { track })
      .then((response) => {
        // Обновляем список избранных треков
        loadFavoriteTracks();
      })
      .catch((error) => console.error(error));
  }

  // Функция для загрузки избранных треков
  function loadFavoriteTracks() {
    axios
      .get("/favorites")
      .then((response) => {
        favoriteTracks.innerHTML = "";
        response.data.forEach((track) => {
          const li = document.createElement("li");
          li.textContent = track.name;
          favoriteTracks.appendChild(li);
        });
      })
      .catch((error) => console.error(error));
  }

  // Загрузка треков при загрузке страницы
  loadTracks();
  loadFavoriteTracks();
});
