var app = angular.module('Teamapp');


app.controller('chatCtrl', function($scope, $stateParams, $state, $timeout, Socket, Session, ChatService){

	$scope.usuarios_conectados = [];
	//$scope.messagesList = new Object();
	$scope.messagesList = [];
	$scope.message = {};

	//_.indexOf($scope.messageList,{chat_id : '' });
	
	$scope.chat = null;
	$scope.messagesG = [];
	$scope.messages = [];

	if ($scope.usuarios_conectados.length <= 0) {
		Socket.emit('usuarios');
	}

	$scope.getTipoChat = function(callback){
		var id = $state.params.hasOwnProperty('id_chat');
		if (id) {
			callback($state.params.id_chat);
		}else{
			callback("general");
		}
		//$scope.messagesList[$scope.chat] = [];
	};

	$scope.whereIAm = function(callback){
		$scope.getTipoChat(function(tipo){
			$scope.chat = tipo;
			if (typeof callback == "function") {
				callback($scope.chat);	
			}
		});
	};

	$scope.enviarMensajeGeneral = function(){
		var data = {};
		data = {contenido : $scope.mensaje, tipo : 'general'};
		ChatService.enviarMensaje(data)
		.then(function(response){
			data.remitente = response.data.remitente;
			Socket.emit('nuevo:mensaje:general', data);
			$scope.mensaje="";
		});
		
	}

	$scope.enviarMensajeIndividual = function(){
		var data = {};
		data = {contenido : $scope.mensaje, tipo : 'individual', destinatario : {_id : $scope.otro._id.toString()}, chat : $scope.chat};
		//console.log(data);
		ChatService.enviarMensaje(data)
		.success(function(response){
			console.log(response);
			data.remitente = response.mensajes[0].remitente;
			//$scope.messages.push(response.mensajes);
			$scope.setChat(data);
			Socket.emit('nuevo:mensaje:individual', data);
			$scope.mensaje="";
		}).error(function(response){
			console.error(response);
		});
		
	}

	$scope.goToChat = function(destino){
		ChatService.crearDarConversacion({destinatario : destino})
		.success(function (response){
			if (response.chat.tipo == "individual") {
				$state.go('app.chat.individual', { id_chat : response.chat._id });
				$scope.yo = response.yo;
				$scope.otro = response.otro;
			}else{
				$state.go('app.chat.general');
			}
		});
		//$timeout(function(){

		//},500);
	}

	$scope.getMensajes = function(){
		$scope.whereIAm(function(chat){
			if (chat == "general") {
				//console.log("general");
				$scope.goToChat("general");
				ChatService.getMensajesGenerales()
				.success(function(response){
					console.log(response);
					$scope.messagesG = response[0].mensajes;
					//console.log($scope.messagesG);
				});
				
			}else{
				//console.log("individual");
				ChatService.getMensajesIndividuales({chat : $scope.chat})
				.success(function(response){
					$scope.goToChat(response.otro._id);
					_.each(response.chat.mensajes, function(mensaje){
						mensaje.chat = response.chat._id;
					});
					$scope.messagesList[$scope.chat] = response.chat.mensajes;
				});
			}
		});
	}();

	

	
	$scope.setChat = function(mensaje){
		if ($scope.messagesList) {
			if (mensaje.chat && $scope.chat) {
				//$scope.messages.push(mensaje);
				//$scope.messagesList[mensaje.chat] = $scope.messages;
				if ($scope.messagesList.hasOwnProperty(mensaje.chat)) {
					//$scope.$apply(function(){
						$scope.messagesList[mensaje.chat].push(mensaje);
					//});
				}else{
					$scope.messagesList[mensaje.chat] = new Array();
					//$scope.$apply(function(){
						$scope.messagesList[mensaje.chat].push(mensaje);
					//});
				}
				//console.log($scope.messagesList, $scope.chat, mensaje);
			}
		}
	}


	Socket.on('usuarios:lista', function(usuarios){
		Session.getUsuario()
		.then(function (response){
			var user = response.data.user.user;
			var conectados = _.reject(usuarios, {_id : user._id});
			angular.copy(conectados, $scope.usuarios_conectados);
		});
	});

	Socket.on('mensaje:general', function(mensaje){
		if ($scope.messagesList && $scope.chat) {
			$scope.messagesG.push(mensaje);
		}
	});

	
	Socket.on('mensaje:individual', function(mensaje){
		$scope.setChat(mensaje);
	});

	$scope.$on('$destroy', function (event) {
        Socket.init();
    });

});
