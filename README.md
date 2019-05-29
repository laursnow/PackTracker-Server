# PackTracker Server

## **[Please see PackTracker client github for further documentation.](https://github.com/laursnow/PackTracker-Client "PackTracker Client")**

## Application Demo
**[Live Application](https://packtracker-app.herokuapp.com/ "packTracker")**

<i class="fas fa-arrow-circle-right"></i> **Demo user:**

Username: sampleuser<br>
Password: samplepassword

## Description

 A simple web app for tracking trip packing. This repository contains the backend for the web application.

## API Documentation

**api/users/ endpoint:**

```
POST          : create a new user
```

**api/packList/ endpoint:**
```
Requires authentification.

PUT/:id       : Update a packing list
POST          : Create a new packing list
GET/db/:id    : Display all saved packing lists for the logged in user
GET/:id       : Display selected packing list
DELETE/:id    : Delete a packing list
```

 ## Technology

This application utilizes React, Redux, Javascript, CSS, node.js, Express, Passport, Mocha/Chai (server unit testing), Enzyme/Jest (client unit testing) and MongoDB.