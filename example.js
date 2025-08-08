const user = {
    username: 'Sam',
    profileImage: 'sam.jpg',
    isAdmin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: true,
    isVerified: true,
}


console.log(btoa(user));
