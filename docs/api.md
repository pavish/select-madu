---
title: Select Madu - API
permalink: /api
---

# API

## Properties
SelectMadu can be initialized with the following properties

|      Property      | Required | Default Value |                            Description                            |
| :----------------: | :------: | :-----------------------: | :-------------------------------------------------------------------: |
|    `datasource`    |     ✔    |            `[]`           |  Array or a function returning a Promise object for async loading     |
|     `selected`     |          | First value of datasource or undefined if not present | Object or array of selected objects |
|     `multiple`     |          |           `false`         |  If true, then multi selection will be used |
|     `search`       |          |           `true`          |  For enabling/disabling searching |
|     `textKey`      |          |           `"text"`          |  The key to use to display in the datasource result |
|     `valueKey`     |          |           `"text"`          |  The key to use to identify the value of the results in the datasource. |
|     `childKey`     |          |         `"children"`        |  The key to use to obtain the values of the nested optgroup |
|     `disabled`     |          |           `false`         |  If true, the instance will be disabled |

## Methods
The following methods can be called from the component instance

|      Method        |                       Description                              |    Usage   |
| :----------------: | :------------------------------------------------------------: | :--------: |
|    `getSelected`   |  Returns the current selected value or values                  |  `instance.getSelected()`
|    `$set`          |  Use this method to set any of the properties dynamically.     |  `instance.$set('disabled', true)`
|    `$destroy`      |  Destroy the SelectMadu instance                               |  `instance.$destroy()`

## Detailed explanation of each of the properties and methods

### Properties
TODO: Fill properties info

### Methods
TODO: Fill methods info

## Read more

Find examples for all use cases in the [examples page][example-page-url]

[example-page-url]: /select-madu/examples
