import dotenv from "dotenv";
dotenv.config(); //esto es para leer el doc .env se puede subir a internet sin problema
//-------------------------

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { leerColores, crearColor, actualizarColor, borrarColor,buscarUsuario} from "./db.js";

function autorizar(peticion,respuesta,siguiente){
       if(peticion.headers.authorization){
          let posibleToken = peticion.headers.authorization.split("Bearer ");
         
          if(posibleToken.length == 2 && posibleToken[0] == ""){
                return jwt.verify(posibleToken[1],process.env.SECRET, (error, datos) => {
                        
                        if(!error){
                                peticion.usuario = datos.usuario;
                                return siguiente();
                        }
                        respuesta.sendStatus(401);

                });
          }
       }
       respuesta.sendStatus(401);
};


const servidor = express();

servidor.use(express.json());

servidor.post("/login", async (peticion,respuesta,siguiente) => {
        let {usuario,password} = peticion.body;

        // Validar que existan usuario y password
        /*if(!usuario || usuario.trim() = "" || !password || password.trim() == ""){
                return siguiente(true);
        }
        */
        if(usuario == undefined || password == undefined){
                return respuesta.sendStatus(400);
        }

        try{

                // Buscar usuario en la base de datos
                let datosUsuario = await buscarUsuario(usuario);

                // Si no existe
                if(!datosUsuario){
                        return respuesta.sendStatus(401);
                }

                // Comprobar contraseña
                let correcta = await bcrypt.compare(password, datosUsuario.password);

                // Contraseña incorrecta
                if(!correcta){
                return respuesta.sendStatus(403);
                }

                let token = jwt.sign({ usuario : datosUsuario._id},process.env.SECRET);

                respuesta.json({ token });

        }catch(e){
            respuesta.sendStatus("500");

    }

});

servidor.use(autorizar); //nadie pasa de aqui sin que yo le de permiso

if (process.env.FRONT){
        servidor.use(express.static("./front-vanilla"));
}

//midelware que sirve los colores a través de la peticion, respuesta

servidor.get("/colores", async (peticion, respuesta) => {
    try{
            let colores = await leerColores(peticion.usuario);


            respuesta.json(colores);
    }catch(e){
            respuesta.sendStatus(500);

    }

    
});

servidor.post("/colores/nuevo", async (peticion,respuesta) => {         
        let {r,g,b} = peticion.body;

        let valido = true;

        [ r,g,b].forEach( n => {
                valido = valido && n != undefined && /^[0-9]{1,3}$/.test(n) && Number(n) <= 255;
        });
        
        if(!valido){
                return siguiente(true);  
        }

        let {usuario} = peticion;

          try{
            let _id = await crearColor (
                {
                        r : Number(r),
                        g : Number(g),
                        b : Number(b),
                        usuario
                
                });
        
        respuesta.status(201);
        respuesta.json({_id});

          }catch(e){
            respuesta.sendStatus(500);
          }
});

//validar actualizar
//valirdar --- id URL (igual al de borrar) validar el objeto que viene en JSON, independientemente del rango (0 - 255)

servidor.patch("/colores/actualizar/:id", async (peticion,respuesta, siguiente) => {

        if(!/^[a-f0-9]{24}$/.test(peticion.params.id)){
                return siguiente();  
        }



        let { r, g, b} = peticion.body;

        let valido = r != undefined || g != undefined || b != undefined;

        let objeCambios =  {};
        let claves = ["r", "g", "b"];


        [ r,g,b].forEach ((n,i) => {

                if(n != undefined){
                        valido = valido && /^[0-9]{1,3}$/.test(n) && Number(n) <= 255;

                        if(valido){
                                objeCambios[claves[i]] = Number(n);
                        }
                }

        });
        if(!valido){
                return siguiente(true);
        }
         try{

                let {modifiedCount, matchedCount} = await actualizarColor(peticion.params.id,objeCambios);
                console.log(modifiedCount, matchedCount);
           if(matchedCount){
            return respuesta.sendStatus(204);
           }
          }catch(e){
                console.log(e);
                respuesta.sendStatus(500);
          };


});


servidor.delete("/colores/borrar/:id", async (peticion,respuesta, siguiente) => {

        /^[a-f0-9]{24}$/.test(peticion.params.id)

         try{
           let cantidad = await borrarColor(peticion.params.id);

           if(cantidad){
            return respuesta.sendStatus(204);
           }
           siguiente();
          }catch(e){
            respuesta.sendStatus(500);
          }


});

servidor.get("/prueba/:algo", (peticion,respuesta) => {
        respuesta.send("valor recibido ---->" + peticion.params.algo);

});

servidor.use((error,peticion,respuesta,siguiente) => {
        respuesta.sendStatus(400);
});

servidor.use((peticion,respuesta) => {
        respuesta.sendStatus(404);
});



servidor.listen(process.env.PORT);