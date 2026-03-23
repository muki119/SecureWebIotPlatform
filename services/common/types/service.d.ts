/**  Service result will be used in conjunction with exception handling 
* * if theres something truly exceptional , i think it only makes sense to throw an error
* * otherwise if its just a logical non killer error - like user not found then it makes sense to return service result
* * this way it kinda acts a dual chanel error handling - you handle the truly ecceptional and the mundane in clear ways and you know where they go and where to put it.
* 
* * Service results are usually errors caused by problems with the request data - so the res will mosst likely be a 40x error
*/
export type ServiceResult<T, E = Error> = [T, null] | [null, E extends Error ? E : Error] // Go style tuple result , because every other return type is annoying 
