const APIController = (function() {
    const clientId = '57be238cb1e64d2d83d34c1f7deb4f6c';
    const clientSecret = 'f8699f09cf5b4dae86a1b1b838f67547';

    return {
        // Retrieves session token
        async getToken() {
            console.log('Retrieving session token');
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
        },
        // Retrieves access token for viewing/modifying user data
        async getAccessToken() {
            const url = new URL(window.location.href);
            const code = url.searchParams.get('code');

            const result = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
                },
                body: {
                    'grant_type': '"authorization_code"',
                    'code': code,
                    'redirect_uri': 'http://localhost/jukebox.html'
                }
            });

            const data = await result.json();
            return data.access_token;
        },
        async setDevice(token) {
            // Get devices info
            console.log('Getting device info');
            const result = await fetch('https://api.spotify.com/v1/me/player/devices', {
                method: 'GET',
                header: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            data = await result.json();

            // Top device ID
            deviceId = data.devices[0].id;

            // Set playback to top playback device
            console.log('Setting playback to top device');
            await fetch('https://api.spotify.com/v1/me/player', {
                method: 'PUT',
                header: {
                    'Authorization': 'Bearer ' + token
                },
                body: {
                    'device_ids': [deviceId],
                    'play': true
                }
            });
        },
        // Gets the ID of the song currently playing
        async getCurrentSongId(token) {
            const result = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                method: 'GET',
                header: {
                    'Authorization': 'Bearer ' + token,
                    'market': 'from_token'
                }
            });
    
            const data = await result.json();
            return data.id;
        },
        // Adds song to queue
        async queueSong(token, trackId) {
            const result = await fetch('https://api.spotify.com/v1/me/player/queue', {
                method: 'POST',
                header: {
                    'Authorization': 'Bearer ' + token,
                    'uri': 'spotify:track:' + trackId
                }
            });
        },
        // Gets genres generated by Spotify
        async getGenres(token) {
            const result = await fetch('https://api.spotify.com/v1/browse/categories?locale=sv_US', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
    
            const data = await result.json();
            return data.categories.items;
        },
        // Gets Spotify playlists based on selected generes
        async getPlaylist(token, genreId) {
            const limit = 10;
        
            const result = await fetch(`https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
    
            const data = await result.json();
            return data.playlists.items;
        },
        // Gets tracks based on selected playlist
        async getTracks(token, tracksEndpoint) {
            const limit = 6;

            const result = await fetch(`${tracksEndpoint}?limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
    
            const data = await result.json();
            return data.items;
        },
        // Retrieves information about the selected track
        async getTrackInfo(token, trackId) {
            const result = await fetch(`${trackId}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
    
            const data = await result.json();
            return data;
        }
    }
})();

const UIController = (function() {
    // Object to hold references to HTML selectors
    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
        divSonglist: '.song-list'
    };

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

        // Create a track list group item 
        createTrack(id, name) {
            const track = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
            document.querySelector(DOMElements.divSonglist).insertAdjacentHTML('beforeend', track);
        },

        // Create the song detail
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
                <label for="Genre" class="form-label col-sm-12">${title}</label>
            </div>
            <div class="row col-sm-12 px-0">
                <label for="artist" class="form-label col-sm-12">by ${artist}</label>
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

const AppController = (function(UICtrlr, APICtrlr) {
    // Get input field object ref
    const DOMInputs = UICtrlr.inputField();
    const currSong = '';

    // Get genres on page load
    const loadGenres = async () => {
        // Get token
        const token = await APICtrlr.getToken();           
        // Store the token onto the page
        UICtrlr.storeToken(token);
        // Set the genres
        const genres = await APICtrlr.getGenres(token);
        // Populate our genres select element
        genres.forEach(element => UICtrlr.createGenre(element.name, element.id));
        // Retrieve access token for viewing/modifying user data
        const accessToken = await APICtrlr.getAccessToken();
        // Set device to top
        console.log('Setting device');
        await APICtrlr.setDevice(accessToken);
        // Get currently playing song
        console.log('Getting current song');
        const trackId = await APICtrlr.getCurrentSongId(accessToken);
        const track = await APICtrlr.getTrackInfo(accessToken, trackId);
        // Show info of currently playing song
        console.log('Creating track detail');
        UICtrlr.createTrackDetail(track.album.images[1].url, track.name, track.artists[0].name);
        currSong = track.name;
        // console.log('Done with loading genres, pinging song end');
        // pingSongEnd(accessToken);
    }

    const pingSongEnd = async (token) => {
        // Get token
        while (true) {
            setTimeout(async () => {
                const trackId = await APICtrlr.getCurrentSongId(token);
                const track = await APICtrlr.getTrackInfo(token, trackId);
                if (track.album.artist.id != currSong) {
                    console.log('Song ended, resetting track detail');
                    // Change info to currently playing song
                    UICtrlr.resetTrackDetail();
                    UICtrlr.createTrackDetail(track.album.images[1].url, track.name, track.artists[0].name); 
                    currSong = track.name;
                }                
            }, 5000);
        }
    }

    // Create genre change event listener
    DOMInputs.genre.addEventListener('change', async () => {
        // Reset the playlist
        UICtrlr.resetPlaylist();
        // Get the token that's stored on the page
        const token = UICtrlr.getStoredToken().token;        
        // Get the genre select field
        const genreSelect = UICtrlr.inputField().genre;       
        // Get the genre id associated with the selected genre
        const genreId = genreSelect.options[genreSelect.selectedIndex].value;             
        // Ge the playlist based on a genre
        const playlist = await APICtrlr.getPlaylist(token, genreId);       
        // Create a playlist item for every playlist returned
        playlist.forEach(p => UICtrlr.createPlaylist(p.name, p.tracks.href));
    });

    // Create submit button click event listener
    DOMInputs.submit.addEventListener('click', async (e) => {
        // Prevent page reset
        e.preventDefault();
        // Clear tracks
        UICtrlr.resetTracks();
        // Get the token
        const token = UICtrlr.getStoredToken().token;        
        // Get the playlist field
        const playlistSelect = UICtrlr.inputField().playlist;
        // Get track endpoint based on the selected playlist
        const tracksEndpoint = playlistSelect.options[playlistSelect.selectedIndex].value;
        // Get the list of tracks
        const tracks = await APICtrlr.getTracks(token, tracksEndpoint);
        // Create a track list item
        tracks.forEach(el => UICtrlr.createTrack(el.track.href, el.track.name))
    });

    // Create song selection click event listener
    DOMInputs.tracks.addEventListener('click', async (e) => {
        // Prevent page reset
        e.preventDefault();
        UICtrlr.resetTrackDetail();
        // Get the token
        const token = UICtrlr.getStoredToken().token;
        // Get the track endpoint
        const trackId = e.target.id;
        // Get the track object
        const track = await APICtrlr.getTrackInfo(token, trackId);
        await APICtrlr.queueSong(token, trackId);
    });

    return {
        async init() {
            console.log('Starting JukePi');
            loadGenres();
        }
    }
})(UIController, APIController);

// Will need to call a method to load the genres on page load
AppController.init();
