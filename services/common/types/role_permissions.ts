export type rolePermissions = {
	/**
	 * isOwner - allows domain deletion and transfer of ownership
	 */
	isOwner: boolean; // allows domain deletion and transfer of ownership
	/**
	 * canManageUsers - allows crud of user in domain , can add users,update user roles and delete users from domain
	 */
	canManageUsers: boolean; // allows crud of user in domain
	/**
	 * canManageDevices - allows crud of devices in domain , can add devices, update device details and delete devices from domain
	 */
	canManageDevices: boolean; // allows crud of devices in domain
	/**
	 * canManageDomain - allows updating of domain details such as name
	 */
	canManageDomain: boolean; // can update domain details
	/**
	 * canControlDevices - allows control of devices in domain - the most basic permission
	 */
	canControlDevices: boolean;
};
