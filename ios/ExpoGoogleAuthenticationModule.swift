import GoogleSignIn
import ExpoModulesCore
import React

public class ExpoGoogleAuthenticationModule: Module {
  var profileImageSize: UInt = 120

  struct ConfigureOptions: Record {
    @Field
    var webClientId: String = ""
    
    @Field
    var iOSClientId: String? = ""

    @Field
    var nonce: String? = ""

    @Field
    var profileImageSize: UInt? = 120
  }

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoGoogleAuthentication')` in JavaScript.
    Name("ExpoGoogleAuthentication")

    Function("configure", configure)
    Function("logout", logout)
    AsyncFunction("signIn", trySignIn)
  }
  
  private func configure(options: ConfigureOptions) -> Void {
    if let profileImageSize = options.profileImageSize {
      self.profileImageSize = profileImageSize;
    }
    
    if let iOSClientId = options.iOSClientId, !iOSClientId.isEmpty {
      let googleConfig = GIDConfiguration(clientID: iOSClientId, serverClientID: options.webClientId)
      GIDSignIn.sharedInstance.configuration = googleConfig
    }
  }

  private func trySignIn(promise: Promise) throws -> Void {
    // First check if user is already signed-in.
    GIDSignIn.sharedInstance.restorePreviousSignIn { user, error in
      if let user = user {
        NSLog("User is signed-in: \(user).")
        promise.resolve(self.userToDictionary(user: user))
        return
      } else if let error = error {
        // If user cancels then errorToCodedException will return without resolving
        // the promise.
        self.errorToCodedException(error: error, promise: promise)
      } else {
        NSLog("User is signed-out. Prompt to sign-in.")
      }
      
      // User was not signed-in. Prompt user to sign-in.
      self.signIn(promise: promise)
    }
  }

  private func signIn(promise: Promise) -> Void {
    let view: UIViewController? = RCTPresentedViewController()
    
    guard view != nil else {
      promise.reject("ERR_INVALID_ENVIRONMENT", "ViewController is nil")
      return
    }
    
    GIDSignIn.sharedInstance.signIn(withPresenting: RCTPresentedViewController()!) { signInResult, error in
      if let signInResult = signInResult {
        NSLog("Sign-in succeeded")
        promise.resolve(self.userToDictionary(user: signInResult.user))
      } else {
        self.errorToCodedException(error: error!, promise: promise)
      }
    }
  }

  private func userToDictionary(user: GIDGoogleUser) -> [String: String?] {
    let hasImage = user.profile?.hasImage ?? false
    let imageURL = (user.profile?.imageURL(withDimension: self.profileImageSize)?.absoluteString) ?? ""
    
    return [
      "displayName": user.profile?.name ?? nil,
      "familyName": user.profile?.familyName ?? nil,
      "givenName": user.profile?.givenName ?? nil,
      "email": user.profile?.email ?? nil,
      "id": user.userID ?? nil,
      "idToken": user.idToken?.tokenString ?? nil,
      "phoneNumber": nil,
      "profilePictureUri": hasImage ? imageURL : nil,
    ]
  }

  private func errorToCodedException(error: Error, promise: Promise) -> Void {
    switch (error as NSError).code {
    case GIDSignInError.canceled.rawValue:
      NSLog("Error occurred during sign-in \(error)")
      promise.reject("ERR_CANCELED", "Error occurred during sign-in \(error)")
    case GIDSignInError.hasNoAuthInKeychain.rawValue:
      // Case should be handled by calling function.
      NSLog("User has never signed in before: \(error).")
    default:
      NSLog("Unknown error: \(error).")
      promise.reject("ERR_FAIL", "Error occurred during sign-in \(error)")
    }
  }

  private func logout() -> Void {
    GIDSignIn.sharedInstance.signOut()
  }
}
