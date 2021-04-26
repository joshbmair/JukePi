const APIController = (function() {
    const clientId = '57be238cb1e64d2d83d34c1f7deb4f6c';
    const clientSecret = 'f8699f09cf5b4dae86a1b1b838f67547';

    // Private methods
    const _getToken = async () => {
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', 
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;
    }

    // Authorize scopes of player
    const _authPlayer = async () => {
        console.log('In authPlayer');

        // Authorize reading playback state
        await fetch('https://accounts.spotify.com/authorize', {
            method: 'POST',
            body: JSON.stringify({
                client_id: clientId,
                response_type: 'code',
                // TODO: Change this to 'http://localhost'
                redirect_uri: 'C:/Users/Josh/OneDrive/Documents/School/CS%20370/JukePi/index.html',
                scope: 'user-read-playback-state'
            })
        });

        // Authorize modifying playback state
        // TODO

        console.log('Read playback authorized.\n');
        return true;
    }
    
    const _getGenres = async (token) => {
        const result = await fetch(`https://api.spotify.com/v1/browse/categories?locale=sv_US`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.categories.items;
    }

    const _getPlaylist = async (token, genreId) => {
        const limit = 25; // TODO: Remove limit feature
        
        const result = await fetch(`https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.playlists.items;
    }

    const _getTracks = async (token, tracksEndPoint) => {
        const limit = 10;

        const result = await fetch(`${tracksEndPoint}?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.items;
    }

    const _getTrack = async (token, trackId) => {
        const result = await fetch(`${trackId}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token}
        });

        const data = await result.json();
        return data;
    }

    return {
        getToken() {
            return _getToken();
        },
        authPlayer() {
            return _authPlayer();
        },
        getGenres(token) {
            return _getGenres(token);
        },
        getPlaylist(token, genreId) {
            return _getPlaylist(token, genreId);
        },
        getTracks(token, tracksEndPoint) {
            return _getTracks(token, tracksEndPoint);
        },
        getTrack(token, trackId) {
            return _getTrack(token, trackId);
        }
    }
})();


// UI Module
const UIController = (function() {
    // Object to hold references to html selectors
    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
        divSonglist: '.song-list'
    }

    // Public methods
    return {
        // Get input fields
        inputField() {
            return {
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSonglist),
                submit: document.querySelector(DOMElements.buttonSubmit),
                songDetail: document.querySelector(DOMElements.divSongDetail)
            }
        },

        // Create select list option
        createGenre(text, value) {
            const genre = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', genre);
        }, 

        createPlaylist(text, value) {
            const playlist = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectPlaylist).insertAdjacentHTML('beforeend', playlist);
        },

        // Need method to create a track list group item 
        createTrack(id, name) {
            const track = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
            document.querySelector(DOMElements.divSonglist).insertAdjacentHTML('beforeend', track);
        },

        // Need method to create the song detail
        createTrackDetail(img, title, artist) {
            const detailDiv = document.querySelector(DOMElements.divSongDetail);
            // Any time user clicks a new song, we need to clear out the song detail div
            detailDiv.innerHTML = '';

            const detail = 
            `
            <div class="row col-sm-12 px-0">
                <img src="${img}" alt="">        
            </div>
            <div class="row col-sm-12 px-0">
                <label for="Genre" class="form-label col-sm-12">${title}:</label>
            </div>
            <div class="row col-sm-12 px-0">
                <label for="artist" class="form-label col-sm-12">By ${artist}:</label>
            </div> 
            `;

            detailDiv.insertAdjacentHTML('beforeend', detail)
        },

        resetTrackDetail() {
            this.inputField().songDetail.innerHTML = '';
        },

        resetTracks() {
            this.inputField().tracks.innerHTML = '';
            this.resetTrackDetail();
        },

        resetPlaylist() {
            this.inputField().playlist.innerHTML = '';
            this.resetTracks();
        },
        
        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },

        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
    }

})();

const APPController = (function(UICtrl, APICtrl) {
    // Get input field object ref
    const DOMInputs = UICtrl.inputField();

    // Get genres on page load
    const loadGenres = async () => {
        // Get the token
        const token = await APICtrl.getToken();           
        // Store the token onto the page
        UICtrl.storeToken(token);
        // Set the genres
        const genres = await APICtrl.getGenres(token);
        // Populate our genres select element
        genres.forEach(element => UICtrl.createGenre(element.name, element.id));
    }

    // Create genre change event listener
    DOMInputs.genre.addEventListener('change', async () => {
        // Reset the playlist
        UICtrl.resetPlaylist();
        // Get the token that's stored on the page
        const token = UICtrl.getStoredToken().token;        
        // Get the genre select field
        const genreSelect = UICtrl.inputField().genre;       
        // Get the genre id associated with the selected genre
        const genreId = genreSelect.options[genreSelect.selectedIndex].value;             
        // Ge the playlist based on a genre
        const playlist = await APICtrl.getPlaylist(token, genreId);       
        // Create a playlist item for every playlist returned
        playlist.forEach(p => UICtrl.createPlaylist(p.name, p.tracks.href));
    });
     

    // Create submit button click event listener
    DOMInputs.submit.addEventListener('click', async (e) => {
        // Prevent page reset
        e.preventDefault();
        // Clear tracks
        UICtrl.resetTracks();
        // Get the token
        const token = UICtrl.getStoredToken().token;        
        // Get the playlist field
        const playlistSelect = UICtrl.inputField().playlist;
        // Get track endpoint based on the selected playlist
        const tracksEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
        // Get the list of tracks
        const tracks = await APICtrl.getTracks(token, tracksEndPoint);
        // Create a track list item
        tracks.forEach(el => UICtrl.createTrack(el.track.href, el.track.name))
        
    });

    // Create song selection click event listener
    DOMInputs.tracks.addEventListener('click', async (e) => {
        // Prevent page reset
        e.preventDefault();
        UICtrl.resetTrackDetail();
        // Get the token
        const token = UICtrl.getStoredToken().token;
        // Get the track endpoint
        const trackId = e.target.id;
        // Get the track object
        const track = await APICtrl.getTrack(token, trackId);
        // Load the track details
        UICtrl.createTrackDetail(track.album.images[2].url, track.name, track.artists[0].name);
    });    

    return {
        init() {
            console.log('Starting JukePi');
            loadGenres();
        }
    }

})(UIController, APIController);

// Will need to call a method to load the genres on page load
APPController.init();
