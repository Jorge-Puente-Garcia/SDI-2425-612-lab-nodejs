const {ObjectId} = require("mongodb");
module.exports = function (app,favoriteSongsRepository,songsRepository) {
    app.get('/songs/favorites', function (req, res) {
        let filter = {};
        let options = {sort: { title: 1}};
        if(req.query.search != null && typeof(req.query.search) != "undefined" && req.query.search != ""){
            filter = {"title": {$regex: ".*" + req.query.search + ".*"}};
        }
        favoriteSongsRepository.getFavoriteSongs(filter, options).then(songs =>
        {res.render("songs/favorites.twig",{songs:songs});
        }).catch(err =>{
            res.send("Se ha producido un error al listar las canciones"+err)
        });
    })

    app.get('/songs/favorites/delete/:song_id', function (req, res) {
        let filter={_id: req.params.song_id };
        favoriteSongsRepository.removeFavoriteSong(filter,{}).then(() => {
            res.redirect('/songs/favorites/');
        }).catch(error =>{
            res.send("Se ha producido un error al recuperar la canción "+error)
        })
    })

    app.post('/songs/favorites/add/:song_id', function (req, res) {
        let filter={_id: new ObjectId(req.params.song_id) };
        songsRepository.findSong(filter,{}).then((songExtracted) => {
            let song = {
                song_id: new ObjectId(req.params.song_id),
                date: Date.now(),
                price: songExtracted.price,
                title: songExtracted.title,
                user: req.session.user
            }
            favoriteSongsRepository.insertFavoriteSong(song,function(result){
                if (result.songId !== null && result.songId !== undefined) {
                    res.send("Agregada la canción a favoritos ID: " + result.songId)
                } else {
                    res.send("Error al insertar canción " + result.error);
                }
            });
        }).catch(error =>{
            res.send("Se ha producido un error al recuperar la canción "+error)
        })

    })
}