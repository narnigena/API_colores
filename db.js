import dotenv from "dotenv";
dotenv.config(); 
//-------------------------

import { MongoClient, ObjectId } from "mongodb";

function conectar(){
    return MongoClient.connect(process.env.MONGO_URL);
}

export function buscarUsuario(nombre){
    return new Promise((ok,ko) => {
        let conexion = null;

        conectar()
        .then(conexionMongo => {
            conexion = conexionMongo;

            let coleccion = conexion.db("colores").collection("usuarios");
            return coleccion.findOne({ usuario : nombre});
        })
        .then(usuario => {
            ok(usuario); 
        })
        .catch( e => ko())
        .finally(() => {
            if(conexion){
                conexion.close();
            }
        });
    });

}

export function leerColores(usuario){
    return new Promise((ok,ko) => {
        let conexion = null;

        conectar()
        .then(conexionMongo => {
            conexion = conexionMongo;
            let coleccion = conexion.db("colores").collection("colores");
            return coleccion.find({usuario}).toArray();
        })
        .then(colores => {
            ok(colores); //extrae los colores y los coloca
        })
        .catch( e => ko())
        .finally(() => {
            if(conexion){
                conexion.close();
            }
        });
    });

}


export function crearColor(objColor){//{r,g,b, usuario}
    return new Promise((ok,ko) => {
        let conexion = null;

        conectar()
        .then(conexionMongo => {
            conexion = conexionMongo;
            let coleccion = conexion.db("colores").collection("colores");
            return coleccion.insertOne(objColor);
        })
        .then(({insertedId}) => {
            ok(insertedId);
        })
        .catch( e => ko())
        .finally(() => {
            if(conexion){
                conexion.close();
            }
        });
    });

}


export function actualizarColor(id,objCambios){//cualquier combinacion de r,g y/o,b
    return new Promise((ok,ko) => {
        let conexion = null;

        conectar()
        .then(conexionMongo => {
            conexion = conexionMongo;
            let coleccion = conexion.db("colores").collection("colores");
            return coleccion.updateOne({_id : new ObjectId(id)}, {$set : objCambios});
        })
        .then( ({modifiedCount,matchedCount})  => {
            ok({modifiedCount,matchedCount}); //cuanto modificó y si encontré lo que buscaba. Si es 0, deberá reconducirte a un 404
        })
        .catch( e => ko())
        .finally(() => {
            if(conexion){
                conexion.close();
            }
        });
    });

}

export function borrarColor(id){//cualquier combinacion de r,g y/o,b
    return new Promise((ok,ko) => {
        let conexion = null;

        conectar()
        .then(conexionMongo => {
            conexion = conexionMongo;
            let coleccion = conexion.db("colores").collection("colores");
            return coleccion.deleteOne({_id : new ObjectId(id) });
        })
        .then( ({deletedCount})  => {
            ok(deletedCount);
        })
        .catch( e => ko())
        .finally(() => {
            if(conexion){
                conexion.close();
            }
        });
    })
} 


/*
buscarUsuario("m4r14")
.then(x => console.log(x))
.catch(() => console.log(X))
*/
