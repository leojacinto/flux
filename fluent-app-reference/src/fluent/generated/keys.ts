import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    meccha_octopus_ba_api: {
                        table: 'sys_ws_definition'
                        id: '0b1b8cb9b4814ec2a275e3e91378c9b3'
                    }
                    meccha_octopus_ba_pool_get: {
                        table: 'sys_ws_operation'
                        id: 'c0eed0c5aa7e451681f15c094bd834f2'
                    }
                    shot_set_create_acl: {
                        table: 'sys_security_acl'
                        id: '6767d08bb6af40639955517b013374c7'
                    }
                    shot_set_delete_acl: {
                        table: 'sys_security_acl'
                        id: '0a271ce0394d40a6a447d3747d076044'
                    }
                    shot_set_read_acl: {
                        table: 'sys_security_acl'
                        id: '96d6ffec1c2645de82e940ea81577ae6'
                    }
                    shot_set_write_acl: {
                        table: 'sys_security_acl'
                        id: 'e55dcffb715a4e65b5bd15fac83c5bcb'
                    }
                }
                composite: [
                    {
                        table: 'sys_security_acl_role'
                        id: '005e449ef26844dd898f08d263eac8ce'
                        key: {
                            sys_security_acl: '96d6ffec1c2645de82e940ea81577ae6'
                            sys_user_role: {
                                id: '7608bdedde6a4cd5a1fc2b3e5b51a610'
                                key: {
                                    name: 'x_snc_meccha_oct_1.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '055b54f95dfa4f94815d2bec0a1ffb5f'
                        key: {
                            sys_security_acl: '96d6ffec1c2645de82e940ea81577ae6'
                            sys_user_role: {
                                id: 'a2a7e1df9b2b428fbf026fcacc041fec'
                                key: {
                                    name: 'admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1a7399eb36304ecb8dba1da7c871ae0e'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'qubits'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1cb3047152404ef1bed94e26505ba38d'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'y'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '1d615d5b4efe4943a8cdeaeaec2d8b22'
                        key: {
                            sys_ui_section: {
                                id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    caption: 'Shot Set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: 'backend'
                            position: '7'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '1f63f1bef7994336a819d087be1920c5'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '2321e12f68054df49d2eeb665919f1ee'
                        key: {
                            sys_ui_section: {
                                id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    caption: 'Shot Set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: 'shots'
                            position: '4'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '2591916f489f473e934853c1f3b6f319'
                        key: {
                            sys_ui_section: {
                                id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    caption: 'Shot Set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: 'label'
                            position: '1'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2bd150891b7341f7857e829d56534d3d'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'bits'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '32c649cb358c473999734ec76d30e978'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'backend'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '378fb675cfa64fdebd0e7a9f912e29d3'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'x'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '3904bd266be440d1ab9284c01367889f'
                        key: {
                            sys_ui_section: {
                                id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    caption: 'Shot Set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: '.split'
                            position: '5'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '40ddf80c501744a4b5071b621485b1b9'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'y'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '4566f1f5c4324dce89eb45ce925d7fbc'
                        key: {
                            sys_ui_section: {
                                id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    caption: 'Shot Set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: '.begin_split'
                            position: '0'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '4abf2f0d49e94decaab7b5d4553f0acc'
                        key: {
                            sys_security_acl: '0a271ce0394d40a6a447d3747d076044'
                            sys_user_role: {
                                id: 'a2a7e1df9b2b428fbf026fcacc041fec'
                                key: {
                                    name: 'admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '4f978ce373be4d66998ff09932bcc30b'
                        key: {
                            sys_ui_section: {
                                id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    caption: 'Shot Set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: '.end_split'
                            position: '9'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '614eaf7685d842c18cb46e7ab507a1a1'
                        key: {
                            logical_table_name: 'x_snc_meccha_oct_1_shot_set'
                            col_name_string: 'x,y'
                        }
                    },
                    {
                        table: 'sys_ui_form'
                        id: '625a464b4cd94a5b9ae2f471d5cb32df'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            view: {
                                id: 'Default view'
                                key: {
                                    name: 'NULL'
                                }
                            }
                            sys_domain: 'global'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '657783559eb24a9b95bc0d8c47326201'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'x'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '6e16340f6a1845ffbf194a76b7ac928e'
                        key: {
                            sys_ui_section: {
                                id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    caption: 'Shot Set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: 'y'
                            position: '3'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6f86f40453f94f59b217bd0f7b7eabc7'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '7608bdedde6a4cd5a1fc2b3e5b51a610'
                        key: {
                            name: 'x_snc_meccha_oct_1.user'
                        }
                    },
                    {
                        table: 'sys_ui_form_section'
                        id: '79129c21298d44f79536d2c757a6eeff'
                        key: {
                            sys_ui_form: {
                                id: '625a464b4cd94a5b9ae2f471d5cb32df'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            sys_ui_section: {
                                id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    caption: 'Shot Set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '866eaf28c5ba431eba6626c5c9c38f97'
                        key: {
                            sys_security_acl: '6767d08bb6af40639955517b013374c7'
                            sys_user_role: {
                                id: '7608bdedde6a4cd5a1fc2b3e5b51a610'
                                key: {
                                    name: 'x_snc_meccha_oct_1.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '881322f5fb334e578903a5ee70cbd88a'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'bits'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9997d43a76614f8f85b8f8d7020183de'
                        key: {
                            sys_security_acl: 'e55dcffb715a4e65b5bd15fac83c5bcb'
                            sys_user_role: {
                                id: 'a2a7e1df9b2b428fbf026fcacc041fec'
                                key: {
                                    name: 'admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9c073deb1145434da79261ba9a54ffff'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'backend'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a4d702f7b5524e0a872974dccf83d88c'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'qubits'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: 'a65ae468c49e4f4dad10488a28dc646b'
                        key: {
                            sys_ui_section: {
                                id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    caption: 'Shot Set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: 'x'
                            position: '2'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a707be4340dd4d1f91b1da5998150561'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'shots'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a8acb2ab741a4b7ea4aba3d23cd6f2ff'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'survival'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a9c47b13768347f4aacff77fec12952c'
                        key: {
                            sys_security_acl: '6767d08bb6af40639955517b013374c7'
                            sys_user_role: {
                                id: 'a2a7e1df9b2b428fbf026fcacc041fec'
                                key: {
                                    name: 'admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: 'b73154cf9f3d4951b9ebd12898810706'
                        key: {
                            sys_ui_section: {
                                id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    caption: 'Shot Set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: 'qubits'
                            position: '8'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c83dbce149af43ee89f8a673fc5cbb9b'
                        key: {
                            sys_security_acl: '0a271ce0394d40a6a447d3747d076044'
                            sys_user_role: {
                                id: '7608bdedde6a4cd5a1fc2b3e5b51a610'
                                key: {
                                    name: 'x_snc_meccha_oct_1.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: 'c8f281e662c049dbb8b05543bdc06c94'
                        key: {
                            sys_ui_section: {
                                id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    caption: 'Shot Set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: 'survival'
                            position: '6'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd802ff5178b54fb182f81ffc7e71505d'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'shots'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd91a93eed7c64b95afbb3a2ad09af5eb'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'label'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ddea3a484e0145e4809e1eedffc1b321'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'df458258361b41f588dafe5ec2f57ee8'
                        key: {
                            sys_security_acl: 'e55dcffb715a4e65b5bd15fac83c5bcb'
                            sys_user_role: {
                                id: '7608bdedde6a4cd5a1fc2b3e5b51a610'
                                key: {
                                    name: 'x_snc_meccha_oct_1.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'e4b46d21b1f047d18f7357ee80bd96f3'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e9475832f9e543b0945e8ae3aa3a96b6'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'label'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: 'ef2ceaa6d18940aaa459dc8849b35303'
                        key: {
                            sys_ui_section: {
                                id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                                key: {
                                    name: 'x_snc_meccha_oct_1_shot_set'
                                    caption: 'Shot Set'
                                    view: {
                                        id: 'Default view'
                                        key: {
                                            name: 'NULL'
                                        }
                                    }
                                    sys_domain: 'global'
                                }
                            }
                            element: 'bits'
                            position: '10'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f024ab8cfff1486dbd5a01c15ca75ad6'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            element: 'survival'
                        }
                    },
                    {
                        table: 'sys_ui_section'
                        id: 'f8000ed7f76e4b5ea63236a986cb5bf1'
                        key: {
                            name: 'x_snc_meccha_oct_1_shot_set'
                            caption: 'Shot Set'
                            view: {
                                id: 'Default view'
                                key: {
                                    name: 'NULL'
                                }
                            }
                            sys_domain: 'global'
                        }
                    },
                ]
            }
        }
    }
}
