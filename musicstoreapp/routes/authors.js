module.exports = function (app) {
    app.get('/authors/add', function(req, res) {
        let roles=[{
            "rol":"Trompetista"},
            {"rol":"Violinista"},
            {"rol":"Saxofonista"},
            {"rol":"Pianista"},
            {"rol":"MALO"},
            {"rol":"Cantante"}];
        let response={rol:'roles',roles:roles};
        res.render("authors/add.twig",response);
    });

    app.post('/authors/add', function(req, res) {
        let roles=[{
            "rol":"Trompetista"},
            {"rol":"Violinista"},
            {"rol":"Saxofonista"},
            {"rol":"Pianista"},
            {"rol":"Cantante"}];
        let response="";
        if(req.body.name ==null || req.body.name === "" ){
            response+="El campo del nombre no es correcto"+req.body.name+"<br>";
        }
        if(req.body.group ==null || req.body.group === "" ){
            response+="El campo del grupo no es correcto"+req.body.group+"<br>";
        }
        if(!roles.some(r => r.rol.toLowerCase() === req.body.rol.toLowerCase())){
            response+="El campo del rol no es correcto"+req.body.rol+"<br>";
        }
        if(response===""){
            response = "Autor agregado: " +req.body.name+"<br>"
                +"grupo:"+req.body.group +"<br>"
                +"rol: "+req.body.rol
        }
        res.send(response);
    });
    app.get('/authors/filter/:rol', function(req, res) {
        let autores=[{
            "name":"a1", "group":"1","rol":"Cantante"},
            {"name":"a2", "group":"dos","rol":"Cantante"},
            {"name":"a4", "group":"dos","rol":"Violinista"},
            {"name":"a5", "group":"dos","rol":"Pianista"},
            {"name":"a3", "group":"tres","rol":"Cantante"}];
        let response={authort:'Autores',authors:autores.filter((word) => word.rol.toLowerCase() == req.params.rol.toLowerCase())};
        res.render("authors/authors.twig",response);
    });
    app.get('/authors/', function(req, res) {
        let autores=[{
            "name":"a1", "group":"1","rol":"Cantante"},
            {"name":"a2", "group":"dos","rol":"Cantante"},
            {"name":"a3", "group":"tres","rol":"Cantante"}];
        let response={authort:'Autores',authors:autores};
        res.render("authors/authors.twig",response);
    });
    app.get('/autho*', function(req, res) {
        res.redirect("/authors/");
    });
};
