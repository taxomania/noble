{
  'targets': [
    {
      'target_name': 'hci-ble',
      'type': 'executable',
      'conditions': [
        ['OS=="linux"', {
          'sources': [
            'src/hci-ble.c'
          ],
          'link_settings': {
            'libraries': [
              '-lbluetooth'
            ]
          }
        }]
      ]
    },
    {
      'target_name': 'l2cap-ble',
      'type': 'executable',
      'conditions': [
        ['OS=="linux"', {
          'sources': [
            'src/l2cap-ble.c'
          ],
          'link_settings': {
            'libraries': [
              '-lbluetooth'
            ]
          }
        }]
      ]
    },
    {
      'target_name': 'dbus-ble',
      'type': 'executable',
      'conditions': [
        ['OS=="linux"', {
          'sources': [
            'src/dbus.c'
          ],
          'cflags': [
            '<!@(pkg-config --cflags dbus-1)',
            '<!@(pkg-config --cflags dbus-glib-1)'
          ],
          'ldflags': [
            '<!@(pkg-config  --libs-only-L --libs-only-other dbus-1)',
            '<!@(pkg-config  --libs-only-L --libs-only-other dbus-glib-1)'
          ],
          'libraries': [
            '<!@(pkg-config  --libs-only-l --libs-only-other dbus-1)',
            '<!@(pkg-config  --libs-only-l --libs-only-other dbus-glib-1)'
          ]
          }
        ]
      ]
    }
  ]
}
