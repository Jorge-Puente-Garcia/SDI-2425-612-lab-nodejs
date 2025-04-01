const {ObjectId} = require("mongodb");
module.exports = function (app, songsRepository,usersRepository) {
    app.get("/api/v1.0/songs", function (req, res) {
        let filter = {};
        let options = {};
        songsRepository.getSongs(filter, options).then(songs => {
            res.status(200);
            res.send({songs: songs})
        }).catch(error => {
            res.status(500);
            res.json({ error: "Se ha producido un error al recuperar las canciones." })
        });
    });

    app.get("/api/v1.0/songs/:id", function (req, res) {
        try {
            let songId = new ObjectId(req.params.id)
            let filter = {_id: songId};
            let options = {};
            songsRepository.findSong(filter, options).then(song => {
                if (song === null) {
                    res.status(404);
                    res.json({error: "ID inválido o no existe"})
                } else {
                    res.status(200);
                    res.json({song: song})
                }
            }).catch(error => {
                res.status(500);
                res.json({error: "Se ha producido un error a recuperar la canción."})
            });
        } catch (e) {
            res.status(500);
            res.json({error: "Se ha producido un error :" + e})
        }
    });

    app.delete('/api/v1.0/songs/:id', function (req, res) {
        try {
            let errors = {};
            let songId = new ObjectId(req.params.id)
            //Añado el autor al filtro para evitar que se borre la canción si no eres el autor.
            let filter = {_id: songId, author: req.session.user.user}
            songsRepository.deleteSong(filter, {}).then(result => {
                if (result === null || result.deletedCount === 0) {
                    errors.author= "No eres el autor, no se ha borrado el registro."
                    res.status(404).json({ errors });

                } else {
                    res.status(200);
                    res.send(JSON.stringify(result));
                }
            }).catch(error => {
                res.status(500);
                res.json({error: "Se ha producido un error al eliminar la canción."})
            });
        } catch (e) {
            res.status(500);
            res.json({error: "Se ha producido un error, revise que el ID sea válido."})
        }
    });

    app.post('/api/v1.0/songs', function (req, res) {
        try {
            let errors = {};

            let song = {
                title: req.body.title,
                kind: req.body.kind,
                price: req.body.price,
                author: req.session.user.user
            };

            // Validaciones con claves específicas
            if (!song.title) {
                errors.title = "El nombre no puede estar vacío.";
            } else if (song.title.length < 5 || song.title.length > 10) {
                errors.title = "La longitud del título debe estar entre 5 y 10 caracteres.";
            }

            if (!song.kind) {
                errors.kind = "El género de la canción no puede estar vacío.";
            }
            if (!song.author) {
                errors.author = "El autor de la canción no puede estar vacío.";
            }
            if (song.price == null || song.price == undefined) {
                errors.price = "El precio de la canción no puede estar vacío.";
            } else if (song.price <= 0) {
                errors.price = "El precio debe ser mayor que 0.";
            }

            // Si hay errores, enviarlos con claves específicas
            if (Object.keys(errors).length > 0) {
                return res.status(409).json({ errors });
            }

            // Insertar la canción en la base de datos
            songsRepository.insertSong(song, function (songId) {
                if (songId === null) {
                    return res.status(409).json({ error: "No se ha podido crear la canción. El recurso ya existe." });
                } else {
                    return res.status(201).json({
                        message: "Canción añadida correctamente.",
                        _id: songId
                    });
                }
            });
        } catch (e) {
            return res.status(500).json({ error: "Se ha producido un error al intentar crear la canción: " + e });
        }
    });


    app.put('/api/v1.0/songs/:id', function (req, res) {
        try {
            let errors = {};

            let songId = new ObjectId(req.params.id);
            //al meter el autor en el filtro me aseguro de que no se encuentre la canción y falle si no eres el autor
            let filter = {_id: songId, author: req.session.user.user};
            //Si la _id NO no existe, no crea un nuevo documento.
            const options = {upsert: false};
            let song = {
                author: req.session.user.user
            }
            if (typeof req.body.title !== "undefined" && req.body.title !== null){
                if (req.body.title.length < 5 || req.body.title.length > 10) {
                    errors.title = "El nombre no puede estar vacío o tener menos de 5 o más de 10 caracteres.";
                }else{
                    song.title = req.body.title;
                }
            }

            if (typeof req.body.kind !== "undefined" && req.body.kind !== null)
                song.kind = req.body.kind;
            if (typeof req.body.price !== "undefined" && req.body.price !== null)
                song.price = req.body.price;
            songsRepository.updateSong(song, filter, options).then(result => {
                if (result === null) {
                    errors.author = "No eres el autor, no se ha actualizado la canción."
                    return res.status(404).json({ errors });
                 }
                //La _id No existe o los datos enviados no difieren de los ya almacenados.
                else if (result.modifiedCount == 0) {
                    errors.author = "No eres el autor, no se ha actualizado la canción."
                    res.status(409).json({ errors });
                }
                else{
                    res.status(200);
                    res.json({
                        message: "Canción modificada correctamente.",
                        result: result
                    })
                }
            }).catch(error => {
                res.status(500);
                res.json({error : "Se ha producido un error al modificar la canción."})
            });
        } catch (e) {
            res.status(500);
            res.json({error: "Se ha producido un error al intentar modificar la canción: "+ e})
        }
    });

    app.post('/api/v1.0/users/login', function (req, res) {
        try{
            let errors = {};

            let securePassword = app.get("crypto").createHmac("sha256", app.get('clave'))
                .update(req.body.password).digest("hex");
            let filter = {
                email: req.body.email,
                password: securePassword
            }
            let options = {};
            usersRepository.findUser(filter, options).then(user => {
                if (user==null) {
                    res.status(401);//unauthorized
                    res.json({
                        message:"Usuario no autorizado",
                        authenticated: false
                    })
                }else{
                    let token = app.get('jwt').sign(
                        {user: user.email, time: Date.now()/1000},
                        "secreto");
                    req.session.user = { user: req.body.email }; // Guardar usuario en sesión
                    res.status(200);
                    res.json({
                        message: "Usuario autorizado",
                        authenticated: true,
                        token: token
                    })
                }
            }).catch(error => {
                res.status(500);
                res.json({
                    message:"Se ha producido un error al versificar credenciales",
                    authenticated: false
                })
            })
        }catch (e){
            res.status(500);
            res.json({
                message:"Se ha producido un error al versificar credenciales",
                authenticated: false
            })
        }
    });
}

