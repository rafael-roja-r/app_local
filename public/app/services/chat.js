angular.module('Teamapp').factory('ChatService', function($http){

	return {
		crearDarConversacion : function(destinatario){
			return $http.post('/conversacion', destinatario);
		},
		enviarMensaje : function(data){
			return $http.post('/mensaje', data)
		},
		getMensajesGenerales :  function(){
			return $http.get('/mensajes/general');
		},
		getMensajesIndividuales :  function(id){
			return $http.get('/mensajes/'+id.chat);
		}
	}
});