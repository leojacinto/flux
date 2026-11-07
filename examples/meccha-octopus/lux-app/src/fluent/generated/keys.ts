import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    'aiux-color-swatch|meccha-octopus-ba': {
                        table: 'sys_aix_color_swatch'
                        id: 'fc7ffc5350dfdd92cd52719d751ce733'
                    }
                    'aiux-experience-page-rel|x-snc-meccha-oct-2-home-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '1d3443803e4677bda59b43600c783c35'
                    }
                    'aiux-experience-prop|appHeadCss': {
                        table: 'sys_aix_experience_properties'
                        id: '781ea80c8af9082175d4e796057890e9'
                    }
                    'aiux-experience-prop|appTailwindCss': {
                        table: 'sys_aix_experience_properties'
                        id: '0f07fb38980f10197a0689ba8380e1d5'
                    }
                    'aiux-experience|meccha-octopus-ba': {
                        table: 'sys_aix_experience'
                        id: '6d4a3cf6671735705ef60889d24c4182'
                    }
                    'aiux-layout-widget|lifecycle': {
                        table: 'sys_aix_widget'
                        id: 'fc5267216723c98815b6ef544e994b09'
                    }
                    'aiux-page-widget|x-snc-meccha-oct-2-home-page': {
                        table: 'sys_aix_widget'
                        id: '539671926ff7e17091a03fc71c3bc76d'
                    }
                    'aiux-page|x-snc-meccha-oct-2-home-page': {
                        table: 'sys_aix_page'
                        id: '1a4fb70dfe15abb9467633fea91ea2cc'
                    }
                    'aiux-project|x_snc_meccha_oct_2': {
                        table: 'sys_aix_project'
                        id: '5b860897847fa83c8a164ac1ebbc1064'
                    }
                    'aiux-theme|meccha-octopus-ba': {
                        table: 'sys_aix_theme'
                        id: 'fb676a08db1b1deb567c0bd8e7405592'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: 'd18c6ce61dcd44e7aa9375eb9875c14f'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '8a2ece52cafd49ba8f6852bf7f96f6d3'
                    }
                }
                composite: [
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '2679d290d65a4b68bf2e3446a3efb783'
                        key: {
                            application_file: '5b860897847fa83c8a164ac1ebbc1064'
                            source_artifact: 'b1c5631c6a8a4fe6881f7b7a8359eb0e'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: 'b1c5631c6a8a4fe6881f7b7a8359eb0e'
                        key: {
                            name: 'aiux-source 5b860897847fa83c8a164ac1ebbc1064'
                        }
                    },
                ]
            }
        }
    }
}
